"""
Assets Endpoints — Extracts all visual assets from a webpage
"""
import asyncio
import logging
import re
import uuid
from typing import List, Optional
from urllib.parse import urlparse, urljoin
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import httpx

logger = logging.getLogger(__name__)
router = APIRouter()

assets_cache = {}


class AssetsRequest(BaseModel):
    url: str
    job_id: Optional[str] = None


def _build_absolute_url(src: str, base_url: str) -> str:
    if src.startswith("data:"):
        return src
    if src.startswith("//"):
        return "https:" + src
    if src.startswith("/"):
        parsed = urlparse(base_url)
        return f"{parsed.scheme}://{parsed.netloc}{src}"
    if not src.startswith("http"):
        return urljoin(base_url, src)
    return src


def _get_filename(url: str) -> str:
    try:
        path = urlparse(url).path
        return path.split("/")[-1] or "asset"
    except Exception:
        return "asset"


def _get_format(url: str) -> str:
    try:
        path = urlparse(url).path.lower()
        for ext in ["svg", "gif", "webp", "png", "jpg", "jpeg", "mp4", "webm", "lottie", "json"]:
            if path.endswith(f".{ext}"):
                return ext
        return "unknown"
    except Exception:
        return "unknown"


def _categorize_asset(url: str, alt: str, cls: str, ctx: str) -> tuple[str, str]:
    """Returns (type, category)"""
    fmt = _get_format(url)
    lower_combined = f"{url} {alt} {cls} {ctx}".lower()

    if fmt == "svg":
        asset_type = "svg"
    elif fmt == "gif":
        asset_type = "gif"
    elif fmt in ["mp4", "webm"]:
        asset_type = "video"
    elif "lottie" in lower_combined or (fmt == "json" and "animation" in lower_combined):
        asset_type = "lottie"
    else:
        asset_type = "image"

    if "logo" in lower_combined:
        category = "logo"
    elif "hero" in lower_combined or "banner" in lower_combined:
        category = "hero"
    elif "product" in lower_combined or "item" in lower_combined:
        category = "product"
    elif "background" in lower_combined or "bg-" in lower_combined:
        category = "background"
    elif "gallery" in lower_combined or "portfolio" in lower_combined:
        category = "gallery"
    elif "icon" in lower_combined or "ico" in lower_combined:
        category = "icon"
    elif "team" in lower_combined or "person" in lower_combined or "avatar" in lower_combined:
        category = "team"
    else:
        category = "general"

    return asset_type, category


async def _extract_assets(url: str) -> List[dict]:
    assets = []
    seen_urls = set()

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (compatible; WebIntelBot/1.0)",
        )
        page = await context.new_page()

        # Intercept image/media responses to get file sizes
        response_sizes = {}

        async def handle_response(response):
            content_type = response.headers.get("content-type", "")
            if any(t in content_type for t in ["image", "video", "svg"]):
                try:
                    body = await response.body()
                    response_sizes[response.url] = len(body)
                except Exception:
                    pass

        page.on("response", handle_response)

        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # Scroll to trigger lazy loading
        await page.evaluate("""
            async () => {
                for (let i = 0; i < 10; i++) {
                    window.scrollBy(0, window.innerHeight);
                    await new Promise(r => setTimeout(r, 300));
                }
                window.scrollTo(0, 0);
            }
        """)
        await page.wait_for_timeout(1000)

        html = await page.content()
        soup = BeautifulSoup(html, "lxml")

        # Extract images
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
            if not src:
                # Try srcset
                srcset = img.get("srcset", "")
                if srcset:
                    src = srcset.split(",")[0].strip().split(" ")[0]

            if not src or src.startswith("data:"):
                continue

            abs_url = _build_absolute_url(src, url)
            if abs_url in seen_urls:
                continue
            seen_urls.add(abs_url)

            alt = img.get("alt", "")
            cls = " ".join(img.get("class", []))
            width = img.get("width")
            height = img.get("height")
            asset_type, category = _categorize_asset(abs_url, alt, cls, "")

            assets.append({
                "type": asset_type,
                "url": abs_url,
                "filename": _get_filename(abs_url),
                "format": _get_format(abs_url),
                "width": int(width) if width and str(width).isdigit() else None,
                "height": int(height) if height and str(height).isdigit() else None,
                "file_size": response_sizes.get(abs_url),
                "alt_text": alt,
                "category": category,
            })

        # Extract SVGs inline
        for svg in soup.find_all("svg"):
            cls = " ".join(svg.get("class", []))
            viewbox = svg.get("viewBox", "")
            assets.append({
                "type": "svg",
                "url": "inline",
                "filename": "inline.svg",
                "format": "svg",
                "width": None,
                "height": None,
                "file_size": len(str(svg)),
                "alt_text": svg.get("aria-label", ""),
                "category": "icon" if cls and "icon" in cls.lower() else "illustration",
                "inline_content": str(svg)[:2000],
            })

        # Extract background images from CSS
        bg_pattern = re.compile(r'url\(["\']?([^"\')\s]+)["\']?\)')
        for element in soup.find_all(style=True):
            style = element.get("style", "")
            for match in bg_pattern.finditer(style):
                src = match.group(1)
                if src and not src.startswith("data:"):
                    abs_url = _build_absolute_url(src, url)
                    if abs_url not in seen_urls:
                        seen_urls.add(abs_url)
                        assets.append({
                            "type": "image",
                            "url": abs_url,
                            "filename": _get_filename(abs_url),
                            "format": _get_format(abs_url),
                            "width": None,
                            "height": None,
                            "file_size": response_sizes.get(abs_url),
                            "alt_text": "",
                            "category": "background",
                        })

        # Extract videos
        for video in soup.find_all("video"):
            for source in video.find_all("source"):
                src = source.get("src", "")
                if src:
                    abs_url = _build_absolute_url(src, url)
                    if abs_url not in seen_urls:
                        seen_urls.add(abs_url)
                        assets.append({
                            "type": "video",
                            "url": abs_url,
                            "filename": _get_filename(abs_url),
                            "format": _get_format(abs_url),
                            "width": video.get("width"),
                            "height": video.get("height"),
                            "file_size": None,
                            "alt_text": "",
                            "category": "video",
                        })

        # Detect Lottie animations
        for script in soup.find_all("script"):
            script_text = script.string or ""
            if "lottie" in script_text.lower() or "dotlottie" in script_text.lower():
                lottie_urls = re.findall(r'src:\s*["\']([^"\']+\.json)["\']', script_text)
                for lu in lottie_urls:
                    abs_url = _build_absolute_url(lu, url)
                    if abs_url not in seen_urls:
                        seen_urls.add(abs_url)
                        assets.append({
                            "type": "lottie",
                            "url": abs_url,
                            "filename": _get_filename(abs_url),
                            "format": "json",
                            "width": None,
                            "height": None,
                            "file_size": None,
                            "alt_text": "Lottie Animation",
                            "category": "animation",
                        })

        await context.close()
        await browser.close()

    return assets


from app.api.v1.endpoints.crawl import jobs

@router.post("/extract")
async def extract_assets(request: AssetsRequest):
    """Extract all visual assets from all discovered pages for the job"""
    url = str(request.url)
    job_id = request.job_id or str(uuid.uuid4())

    try:
        urls_to_scan = [url]
        if request.job_id and request.job_id in jobs:
            for p in jobs[request.job_id].get("pages", []):
                p_url = p.get("url")
                if p_url and p_url not in urls_to_scan:
                    urls_to_scan.append(p_url)
                    
        all_assets = []
        seen_assets = set()
        
        sem = asyncio.Semaphore(5)
        
        async def scan_url(u):
            async with sem:
                try:
                    return await _extract_assets(u)
                except Exception as e:
                    logger.error(f"Failed to extract assets from {u}: {e}")
                    return []
                    
        tasks = [scan_url(u) for u in urls_to_scan]
        results = await asyncio.gather(*tasks)
        
        for res_assets in results:
            for a in res_assets:
                if a["url"] != "inline":
                    if a["url"] not in seen_assets:
                        seen_assets.add(a["url"])
                        all_assets.append(a)
                else:
                    # For inline SVGs, we might want to deduplicate by inline_content hash, but appending is fine.
                    # Or just ignore inline deduplication and keep all, but maybe too many.
                    content = a.get("inline_content", "")
                    if content not in seen_assets:
                        seen_assets.add(content)
                        all_assets.append(a)

        assets_cache[job_id] = {"url": url, "assets": all_assets}

        # Group by type for summary
        summary = {}
        for a in all_assets:
            summary[a["type"]] = summary.get(a["type"], 0) + 1

        return {
            "job_id": job_id,
            "url": url,
            "total": len(all_assets),
            "summary": summary,
            "assets": all_assets,
        }
    except Exception as e:
        logger.error(f"Asset extraction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download")
async def download_asset(asset_url: str):
    """Proxy download of an asset"""
    async def streamer():
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            async with client.stream("GET", asset_url) as r:
                async for chunk in r.aiter_bytes(chunk_size=8192):
                    yield chunk

    filename = _get_filename(asset_url)
    return StreamingResponse(
        streamer(),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        media_type="application/octet-stream",
    )


@router.get("/{job_id}")
async def get_assets(job_id: str):
    """Get extracted assets for a job"""
    if job_id not in assets_cache:
        raise HTTPException(status_code=404, detail="Assets not found")
    return assets_cache[job_id]
