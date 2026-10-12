"""
Analysis Endpoints — Full website analysis: overview, brand, SEO, tech, social, contacts
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

from app.services.analyzer import analyzer_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Shared analysis cache
analysis_cache: Dict[str, Any] = {}


class AnalysisRequest(BaseModel):
    url: str
    job_id: Optional[str] = None


async def _render_page(url: str) -> tuple[str, Dict, str]:
    """Render page with Playwright and return html, headers, final_url"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--single-process"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (compatible; WebIntelBot/1.0)",
            viewport={"width": 1920, "height": 1080},
        )
        page = await context.new_page()
        headers_captured = {}

        async def on_response(response):
            if response.url == page.url:
                try:
                    headers_captured.update(dict(response.headers))
                except Exception:
                    pass

        page.on("response", on_response)

        try:
            resp = await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)
            html = await page.content()
            final_url = page.url
            if resp:
                headers_captured.update(dict(resp.headers))
        finally:
            await page.close()
            await context.close()
            await browser.close()

    return html, headers_captured, final_url


async def _get_css_texts(html: str, base_url: str) -> list[str]:
    """Fetch CSS files referenced in the page"""
    soup = BeautifulSoup(html, "lxml")
    css_urls = []
    for link in soup.find_all("link", rel="stylesheet"):
        href = link.get("href", "")
        if href:
            if href.startswith("//"):
                href = "https:" + href
            elif href.startswith("/"):
                parsed = urlparse(base_url)
                href = f"{parsed.scheme}://{parsed.netloc}{href}"
            css_urls.append(href)

    css_texts = []
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for css_url in css_urls[:10]:
            try:
                resp = await client.get(css_url)
                if resp.status_code == 200:
                    css_texts.append(resp.text)
            except Exception:
                pass
    return css_texts


@router.post("/website")
async def analyze_website(request: AnalysisRequest):
    """Full website analysis — overview, brand, navigation, SEO, tech, social, contacts"""
    url = str(request.url)
    cache_key = url

    if cache_key in analysis_cache:
        return analysis_cache[cache_key]

    try:
        # Render page
        html, headers, final_url = await _render_page(url)
        soup = await asyncio.to_thread(BeautifulSoup, html, "lxml")
        css_texts = await _get_css_texts(html, url)
        domain = urlparse(url).netloc.replace("www.", "")

        # Overview
        try:
            cms = await asyncio.to_thread(analyzer_service.detect_cms, html, headers)
        except Exception as e:
            logger.warning(f"Failed to detect CMS: {e}")
            cms = None

        try:
            framework = await asyncio.to_thread(analyzer_service.detect_framework, html, headers)
        except Exception as e:
            logger.warning(f"Failed to detect framework: {e}")
            framework = None

        try:
            cdn = await asyncio.to_thread(analyzer_service.detect_cdn, headers)
        except Exception as e:
            logger.warning(f"Failed to detect CDN: {e}")
            cdn = None

        try:
            hosting = await asyncio.to_thread(analyzer_service.detect_hosting, headers)
        except Exception as e:
            logger.warning(f"Failed to detect hosting: {e}")
            hosting = None

        try:
            analytics = await asyncio.to_thread(analyzer_service.detect_analytics, html)
        except Exception as e:
            logger.warning(f"Failed to detect analytics: {e}")
            analytics = []

        try:
            domain_age = await analyzer_service.get_domain_age(domain)
        except Exception as e:
            logger.warning(f"Failed to get domain age: {e}")
            domain_age = None

        # Favicon
        favicon_tag = soup.find("link", rel=lambda x: x and "icon" in x.lower())
        favicon = favicon_tag.get("href") if favicon_tag else f"{url}/favicon.ico"
        if favicon and favicon.startswith("/"):
            parsed = urlparse(url)
            favicon = f"{parsed.scheme}://{parsed.netloc}{favicon}"

        lang_tag = soup.find("html")
        language = lang_tag.get("lang", "en") if lang_tag else "en"

        title_tag = soup.find("title")
        title = title_tag.string if title_tag else None
        meta_desc_tag = soup.find("meta", attrs={"name": "description"})
        meta_description = meta_desc_tag.get("content") if meta_desc_tag else None

        overview = {
            "url": url,
            "final_url": final_url,
            "title": title,
            "meta_title": title,
            "meta_description": meta_description,
            "domain_age": domain_age,
            "favicon": favicon,
            "language": language,
            "cms": cms,
            "framework": framework,
            "hosting": hosting,
            "cdn": cdn,
            "analytics": analytics,
        }

        # Brand / Design Tokens
        try:
            colors = await asyncio.to_thread(analyzer_service.extract_colors, html, css_texts)
        except Exception as e:
            logger.warning(f"Failed to extract colors: {e}")
            colors = []

        try:
            fonts = await asyncio.to_thread(analyzer_service.extract_fonts, html, css_texts)
        except Exception as e:
            logger.warning(f"Failed to extract fonts: {e}")
            fonts = []

        # Extract border-radius and spacing from CSS
        import re
        border_radii = list(set(re.findall(r'border-radius:\s*([^;]+)', " ".join(css_texts))))[:5]
        spacings = list(set(re.findall(r'(?:margin|padding):\s*([^;]+)', " ".join(css_texts))))[:5]

        # Logo detection
        logo_urls = []
        for img in soup.find_all("img"):
            src = img.get("src", "")
            alt = (img.get("alt", "") or "").lower()
            cls = " ".join(img.get("class", [])).lower()
            if "logo" in alt or "logo" in cls or "logo" in src.lower():
                if src.startswith("/"):
                    parsed = urlparse(url)
                    src = f"{parsed.scheme}://{parsed.netloc}{src}"
                logo_urls.append(src)

        brand = {
            "logo_urls": list(set(logo_urls))[:5],
            "favicon": favicon,
            "colors": colors,
            "fonts": fonts,
            "border_radius": border_radii,
            "spacing": spacings,
        }

        # Navigation
        try:
            navigation = await asyncio.to_thread(analyzer_service.extract_navigation, html)
        except Exception as e:
            logger.warning(f"Failed to extract navigation: {e}")
            navigation = {}

        # SEO
        try:
            seo = await asyncio.to_thread(analyzer_service.extract_seo_data, html, url)
        except Exception as e:
            logger.warning(f"Failed to extract SEO data: {e}")
            seo = {}

        # Technologies
        try:
            technologies = await asyncio.to_thread(analyzer_service.detect_technologies, html, headers, url)
        except Exception as e:
            logger.warning(f"Failed to detect technologies: {e}")
            technologies = []

        # Social Media
        try:
            social = await asyncio.to_thread(analyzer_service.extract_social_links, html)
        except Exception as e:
            logger.warning(f"Failed to extract social links: {e}")
            social = {}

        # Contacts
        try:
            contacts = await asyncio.to_thread(analyzer_service.extract_contacts, html)
        except Exception as e:
            logger.warning(f"Failed to extract contacts: {e}")
            contacts = {}

        result = {
            "job_id": request.job_id,
            "url": url,
            "overview": overview,
            "brand": brand,
            "navigation": navigation,
            "seo": seo,
            "technologies": technologies,
            "social_media": social,
            "contacts": contacts,
        }

        analysis_cache[cache_key] = result
        return result

    except Exception as e:
        logger.error(f"Analysis failed for {url}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/cached/{job_id}")
async def get_cached_analysis(job_id: str):
    """Get cached analysis result"""
    for key, data in analysis_cache.items():
        if data.get("job_id") == job_id:
            return data
    raise HTTPException(status_code=404, detail="Analysis not found")
