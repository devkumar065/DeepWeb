"""
Unified Scanner Service — The core scan pipeline for DeepWeb.
Replaces the old sequential approach (crawl → analysis → screenshots → assets)
with a unified pipeline: ONE browser, ALL work done in ~30-60 seconds.

Pipeline:
  Phase 1: Quick HTTP Fetch (2-3s)
    - httpx GET homepage → HTML + headers
    - Parallel: sitemap.xml, robots.txt
    - Run all analyzer detections (tech, SEO, colors, fonts, social, contacts)
    
  Phase 2: Playwright Session (10-20s)
    - ONE browser context for everything
    - Homepage render + screenshots (desktop, tablet, mobile)
    - Asset extraction from rendered DOM
    - Smart crawl top priority pages
    
    - Combine all results, mark scan complete
"""
import asyncio
import base64
import logging
import re
import time
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable, Set
from urllib.parse import urlparse, urljoin

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import BrowserContext, Page

from app.services.browser_pool import browser_pool
from app.services.analyzer import analyzer_service
from app.services.crawler import crawler_service
from app.services import database as db
from app.core.config import settings

logger = logging.getLogger(__name__)

# Priority pages to crawl first (after homepage)
PRIORITY_PATHS = [
    "/about", "/about-us", "/company",
    "/services", "/solutions", "/products",
    "/pricing", "/plans",
    "/contact", "/contact-us",
    "/blog", "/news",
    "/careers", "/jobs",
    "/portfolio", "/work", "/projects",
    "/faq", "/help",
    "/team",
    "/privacy", "/terms",
]

SCREENSHOT_VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900, "scale": 1},
    "tablet": {"width": 768, "height": 1024, "scale": 1},
    "mobile": {"width": 390, "height": 844, "scale": 2},
}


class ScanProgress:
    """Tracks scan progress and stores results. Thread-safe via asyncio."""
    
    def __init__(self, scan_id: str, url: str):
        self.scan_id = scan_id
        self.url = url
        self.status = "running"
        self.phase = "initializing"
        self.progress = 0.0
        self.logs: List[str] = []
        self.started_at = datetime.now().isoformat()
        self.finished_at: Optional[str] = None
        self.error: Optional[str] = None
        
        # Results
        self.pages: List[Dict] = []
        self.overview: Dict = {}
        self.brand: Dict = {}
        self.navigation: Dict = {}
        self.seo: Dict = {}
        self.technologies: List[Dict] = []
        self.social_media: Dict = {}
        self.contacts: Dict = {}
        self.assets: List[Dict] = []
        self.screenshots: List[Dict] = []
        
        # Callback for SSE streaming
        self._listeners: List[asyncio.Queue] = []
    
    def add_listener(self) -> asyncio.Queue:
        """Add an SSE listener queue."""
        q = asyncio.Queue()
        self._listeners.append(q)
        return q
    
    def remove_listener(self, q: asyncio.Queue):
        """Remove an SSE listener queue."""
        if q in self._listeners:
            self._listeners.remove(q)
    
    def log(self, message: str):
        """Add a log message and notify all listeners."""
        ts = datetime.now().strftime("%H:%M:%S")
        entry = f"[{ts}] {message}"
        self.logs.append(entry)
        self._notify()
    
    def set_phase(self, phase: str, progress: float = 0.0):
        """Update the current scan phase."""
        self.phase = phase
        self.progress = progress
        self._notify()
    
    def set_progress(self, progress: float):
        """Update progress within current phase."""
        self.progress = min(100.0, progress)
        self._notify()
    
    def _notify(self):
        """Push current state snapshot to all SSE listeners."""
        snapshot = self.to_dict()
        for q in self._listeners:
            try:
                q.put_nowait(snapshot)
            except asyncio.QueueFull:
                pass  # Drop if queue is full
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize current state for API response."""
        return {
            "scan_id": self.scan_id,
            "url": self.url,
            "status": self.status,
            "phase": self.phase,
            "progress": self.progress,
            "logs": self.logs[-50:],
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "error": self.error,
            "pages_found": len(self.pages),
        }
    
    def get_full_results(self) -> Dict[str, Any]:
        """Get complete results for a finished scan."""
        return {
            "scan_id": self.scan_id,
            "url": self.url,
            "status": self.status,
            "phase": self.phase,
            "progress": self.progress,
            "logs": self.logs,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "overview": self.overview,
            "brand": self.brand,
            "navigation": self.navigation,
            "seo": self.seo,
            "technologies": self.technologies,
            "social_media": self.social_media,
            "contacts": self.contacts,
            "pages": self.pages,
            "assets": self.assets,
            "screenshots": self.screenshots,
        }


# Global scan store
active_scans: Dict[str, ScanProgress] = {}


async def run_unified_scan(scan_id: str, url: str, max_pages: int = 300):
    """Main scan pipeline. Runs as a background task."""
    scan = active_scans[scan_id]
    domain = urlparse(url).netloc.replace("www.", "")
    
    try:
        await db.record_scan_started(scan_id, url, domain)
        
        # ═══════════════════════════════════════════════════════════════
        # PHASE 1: Quick HTTP Fetch (2-3 seconds)
        # ═══════════════════════════════════════════════════════════════
        scan.set_phase("fetching", 0)
        scan.log("▶ Starting scan...")
        scan.log("◎ Fetching website data...")
        
        html = ""
        headers = {}
        final_url = url
        
        async with httpx.AsyncClient(
            follow_redirects=True, 
            timeout=20.0,
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
        ) as client:
            # Fetch homepage + sitemap + robots in parallel
            homepage_task = client.get(url)
            sitemap_task = asyncio.create_task(crawler_service.parse_sitemap(url))
            robots_task = asyncio.create_task(crawler_service.parse_robots(url))
            
            try:
                resp = await homepage_task
                html = resp.text
                headers = dict(resp.headers)
                final_url = str(resp.url)
                scan.log(f"✓ Website responded ({resp.status_code})")
            except Exception as e:
                scan.log(f"⚠ HTTP fetch failed: {str(e)[:80]}")
                # We'll try Playwright instead
            
            sitemap_urls = await sitemap_task
            robots_sitemaps = await robots_task
        
        scan.set_progress(20)
        
        if sitemap_urls:
            scan.log(f"✓ Sitemap: {len(sitemap_urls)} URLs found")
        if robots_sitemaps:
            scan.log(f"✓ Robots.txt: {len(robots_sitemaps)} sitemaps found")
        
        # ─── Run all analyzer detections on the HTTP-fetched HTML ─────
        scan.log("◎ Detecting technologies...")
        
        # These are all fast CPU-bound regex operations — no need for to_thread
        technologies = analyzer_service.detect_technologies(html, headers, url)
        cms = analyzer_service.detect_cms(html, headers)
        framework = analyzer_service.detect_framework(html, headers)
        cdn = analyzer_service.detect_cdn(headers)
        hosting = analyzer_service.detect_hosting(headers)
        analytics = analyzer_service.detect_analytics(html)
        seo_data = analyzer_service.extract_seo_data(html, url)
        social_links = analyzer_service.extract_social_links(html)
        contacts = analyzer_service.extract_contacts(html)
        navigation = analyzer_service.extract_navigation(html)
        
        scan.technologies = technologies
        scan.seo = seo_data
        scan.social_media = social_links
        scan.contacts = contacts
        scan.navigation = navigation
        
        if technologies:
            scan.log(f"✓ Detected {len(technologies)} technologies")
        
        scan.set_progress(40)
        
        # ─── Fetch CSS files for color/font extraction ───────────────
        scan.log("◎ Extracting design tokens...")
        css_texts = await _fetch_css_files(html, url)
        
        colors = analyzer_service.extract_colors(html, css_texts)
        fonts = analyzer_service.extract_fonts(html, css_texts)
        
        # Extract border-radius and spacing from CSS
        css_combined = " ".join(css_texts)
        border_radii = list(set(re.findall(r'border-radius:\s*([^;]+)', css_combined)))[:5]
        spacings = list(set(re.findall(r'(?:margin|padding):\s*([^;]+)', css_combined)))[:5]
        
        scan.brand = {
            "colors": colors,
            "fonts": fonts,
            "border_radius": border_radii,
            "spacing": spacings,
            "logo_urls": [],
            "favicon": None,
        }
        
        scan.log(f"✓ Found {len(colors)} colors, {len(fonts)} fonts")
        scan.set_progress(50)
        
        # ─── Domain age (can be slow, run with timeout) ──────────────
        domain_age = None
        try:
            domain_age = await asyncio.wait_for(
                analyzer_service.get_domain_age(domain), timeout=5.0
            )
        except (asyncio.TimeoutError, Exception):
            pass
        
        # ─── Build overview ──────────────────────────────────────────
        soup = BeautifulSoup(html, "lxml")
        
        favicon_tag = soup.find("link", rel=lambda x: x and "icon" in str(x).lower() if x else False)
        favicon = favicon_tag.get("href") if favicon_tag else f"{url}/favicon.ico"
        if favicon and favicon.startswith("/"):
            parsed = urlparse(url)
            favicon = f"{parsed.scheme}://{parsed.netloc}{favicon}"
        
        lang_tag = soup.find("html")
        language = lang_tag.get("lang", "en") if lang_tag else "en"
        title = soup.title.string if soup.title else None
        meta_desc_tag = soup.find("meta", attrs={"name": "description"})
        meta_description = meta_desc_tag.get("content") if meta_desc_tag else None
        
        # Logo detection
        logo_urls = []
        for img in soup.find_all("img"):
            src = img.get("src", "")
            alt = (img.get("alt", "") or "").lower()
            cls = " ".join(img.get("class", [])).lower()
            if "logo" in alt or "logo" in cls or "logo" in src.lower():
                if src.startswith("/"):
                    parsed_url = urlparse(url)
                    src = f"{parsed_url.scheme}://{parsed_url.netloc}{src}"
                logo_urls.append(src)
        
        scan.overview = {
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
        scan.brand["logo_urls"] = list(set(logo_urls))[:5]
        scan.brand["favicon"] = favicon
        
        scan.log("✓ Website overview complete")
        scan.set_phase("fetching", 100)
        
        # ═══════════════════════════════════════════════════════════════
        # PHASE 2: Playwright Session (10-20 seconds)
        # ═══════════════════════════════════════════════════════════════
        scan.set_phase("rendering", 0)
        scan.log("◎ Launching browser for screenshots...")
        
        context = await browser_pool.new_context(
            viewport={"width": 1440, "height": 900}
        )
        
        try:
            # ─── Take screenshots (desktop, tablet, mobile) ──────────
            screenshots = []
            
            for vp_name, vp_config in SCREENSHOT_VIEWPORTS.items():
                try:
                    page = await context.new_page()
                    await page.set_viewport_size({"width": vp_config["width"], "height": vp_config["height"]})
                    
                    try:
                        await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    except Exception as e:
                        logger.warning(f"goto timeout/error for {vp_name}: {e}")
                        
                    await page.wait_for_timeout(1000)
                    
                    # Viewport screenshot
                    ss_bytes = await page.screenshot(full_page=False, type="png")
                    b64 = base64.b64encode(ss_bytes).decode()
                    screenshots.append({
                        "viewport": vp_name,
                        "data_url": f"data:image/png;base64,{b64}",
                        "width": vp_config["width"],
                        "height": vp_config["height"],
                        "full_page": False,
                    })
                    
                    # Full page screenshot (only for desktop)
                    if vp_name == "desktop":
                        try:
                            full_bytes = await page.screenshot(full_page=True, type="png")
                            b64_full = base64.b64encode(full_bytes).decode()
                            screenshots.append({
                                "viewport": f"{vp_name}_fullpage",
                                "data_url": f"data:image/png;base64,{b64_full}",
                                "width": vp_config["width"],
                                "height": vp_config["height"],
                                "full_page": True,
                            })
                        except Exception as e:
                            logger.warning(f"Full page screenshot failed for {vp_name}: {e}")
                    
                    # Extract assets from the rendered DOM (only from first viewport)
                    if vp_name == "desktop":
                        scan.log("◎ Extracting assets...")
                        rendered_html = await page.content()
                        assets = _extract_assets_from_html(rendered_html, url)
                        scan.assets = assets
                        scan.log(f"✓ Found {len(assets)} assets")
                    
                    await page.close()
                    scan.log(f"✓ Screenshot: {vp_name}")
                except Exception as e:
                    logger.warning(f"Screenshot failed for {vp_name}: {e}")
                    scan.log(f"⚠ Screenshot failed: {vp_name}")
            
            scan.screenshots = screenshots
            scan.set_phase("rendering", 50)
            
            # ─── Smart Page Crawl ────────────────────────────────────
            scan.log("◎ Discovering pages...")
            
            # Build URL list: homepage + sitemap + priority paths
            all_urls: Set[str] = {url}
            parsed_base = urlparse(url)
            base = f"{parsed_base.scheme}://{parsed_base.netloc}"
            
            # Add priority paths
            for path in PRIORITY_PATHS:
                all_urls.add(f"{base}{path}")
            
            # Add sitemap URLs (limited)
            for su in sitemap_urls[:max_pages]:
                all_urls.add(su)
            
            # Crawl pages with concurrency limit
            discovered_pages = []
            # Add homepage as first page
            discovered_pages.append({
                "url": url,
                "title": title,
                "type": crawler_service.categorize_page(url, title or "").value,
                "depth": 0,
                "status_code": 200,
            })
            
            sem = asyncio.Semaphore(3)
            pages_checked = 0
            urls_to_check = list(all_urls - {url})[:max_pages - 1]
            
            async def check_page(page_url: str):
                nonlocal pages_checked
                async with sem:
                    try:
                        page = await context.new_page()
                        resp = await page.goto(page_url, wait_until="domcontentloaded", timeout=10000)
                        if resp and resp.status < 400:
                            pg_title = await page.title()
                            discovered_pages.append({
                                "url": page_url,
                                "title": pg_title,
                                "type": crawler_service.categorize_page(page_url, pg_title).value,
                                "depth": 1,
                                "status_code": resp.status,
                            })
                            
                            # Capture subpage screenshot (low quality JPEG to save memory)
                            try:
                                ss_bytes = await page.screenshot(full_page=False, type="jpeg", quality=40)
                                b64 = base64.b64encode(ss_bytes).decode()
                                screenshots.append({
                                    "viewport": f"subpage_{pages_checked}",
                                    "data_url": f"data:image/jpeg;base64,{b64}",
                                    "width": 1920,
                                    "height": 1080,
                                    "full_page": False,
                                    "url": page_url
                                })
                            except Exception as e:
                                logger.debug(f"Subpage screenshot failed for {page_url}: {e}")
                                
                        await page.close()
                    except Exception:
                        pass
                    finally:
                        pages_checked += 1
                        if pages_checked % 5 == 0:
                            scan.log(f"◎ Checked {pages_checked}/{len(urls_to_check)} pages")
                            scan.set_progress(50 + (pages_checked / max(len(urls_to_check), 1)) * 40)
            
            if urls_to_check:
                await asyncio.gather(*[check_page(u) for u in urls_to_check])
            
            scan.screenshots = screenshots
            scan.pages = discovered_pages
            scan.log(f"✓ Found {len(discovered_pages)} pages")
            scan.set_phase("rendering", 100)
            
        finally:
            await context.close()
        

        
        # ═══════════════════════════════════════════════════════════════
        # PHASE 4: Finalize
        # ═══════════════════════════════════════════════════════════════
        scan.set_phase("complete", 100)
        scan.status = "completed"
        scan.finished_at = datetime.now().isoformat()
        elapsed = (datetime.fromisoformat(scan.finished_at) - datetime.fromisoformat(scan.started_at)).total_seconds()
        scan.log(f"✓ Scan complete in {elapsed:.1f}s")
        scan.log(f"✓ {len(discovered_pages)} pages | {len(technologies)} technologies | {len(scan.assets)} assets")
        
        await db.record_scan_finished(
            scan_id, "completed", len(discovered_pages), scan.started_at
        )
        
    except Exception as e:
        scan.status = "failed"
        scan.error = str(e)
        scan.finished_at = datetime.now().isoformat()
        scan.log(f"✗ Scan failed: {str(e)[:200]}")
        logger.error(f"Unified scan failed for {url}: {e}", exc_info=True)
        
        await db.record_scan_finished(
            scan_id, "failed", len(scan.pages), scan.started_at
        )


async def _fetch_css_files(html: str, base_url: str) -> List[str]:
    """Fetch CSS files referenced in the HTML."""
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
            elif not href.startswith("http"):
                href = urljoin(base_url, href)
            css_urls.append(href)
    
    css_texts = []
    if css_urls:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            tasks = [client.get(u) for u in css_urls[:8]]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, httpx.Response) and r.status_code == 200:
                    css_texts.append(r.text)
    return css_texts


def _extract_assets_from_html(html: str, base_url: str) -> List[Dict]:
    """Extract all visual assets from rendered HTML (no Playwright needed)."""
    soup = BeautifulSoup(html, "lxml")
    assets = []
    seen_urls: Set[str] = set()
    
    def build_abs_url(src: str) -> str:
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
    
    def get_format(u: str) -> str:
        path = urlparse(u).path.lower()
        for ext in ["svg", "gif", "webp", "png", "jpg", "jpeg", "mp4", "webm"]:
            if path.endswith(f".{ext}"):
                return ext
        return "unknown"
    
    def get_filename(u: str) -> str:
        try:
            return urlparse(u).path.split("/")[-1] or "asset"
        except Exception:
            return "asset"
    
    # Images
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
        if not src:
            srcset = img.get("srcset", "")
            if srcset:
                src = srcset.split(",")[0].strip().split(" ")[0]
        if not src or src.startswith("data:"):
            continue
        
        abs_url = build_abs_url(src)
        if abs_url in seen_urls:
            continue
        seen_urls.add(abs_url)
        
        alt = img.get("alt", "")
        cls = " ".join(img.get("class", [])).lower()
        lower_combined = f"{abs_url} {alt} {cls}".lower()
        
        category = "general"
        if "logo" in lower_combined:
            category = "logo"
        elif "hero" in lower_combined or "banner" in lower_combined:
            category = "hero"
        elif "icon" in lower_combined:
            category = "icon"
        
        fmt = get_format(abs_url)
        asset_type = "svg" if fmt == "svg" else ("gif" if fmt == "gif" else "image")
        
        width = img.get("width")
        height = img.get("height")
        
        assets.append({
            "type": asset_type,
            "url": abs_url,
            "filename": get_filename(abs_url),
            "format": fmt,
            "width": int(width) if width and str(width).isdigit() else None,
            "height": int(height) if height and str(height).isdigit() else None,
            "file_size": None,
            "alt_text": alt,
            "category": category,
        })
    
    # Inline SVGs
    for svg in soup.find_all("svg"):
        svg_str = str(svg)
        if len(svg_str) > 50000:  # Skip massive SVGs
            continue
        cls = " ".join(svg.get("class", [])).lower()
        assets.append({
            "type": "svg",
            "url": "inline",
            "filename": "inline.svg",
            "format": "svg",
            "width": None,
            "height": None,
            "file_size": len(svg_str),
            "alt_text": svg.get("aria-label", ""),
            "category": "icon" if "icon" in cls else "illustration",
            "inline_content": svg_str,
        })
    
    # Videos
    for video in soup.find_all("video"):
        for source in video.find_all("source"):
            src = source.get("src", "")
            if src:
                abs_url = build_abs_url(src)
                if abs_url not in seen_urls:
                    seen_urls.add(abs_url)
                    assets.append({
                        "type": "video",
                        "url": abs_url,
                        "filename": get_filename(abs_url),
                        "format": get_format(abs_url),
                        "width": None,
                        "height": None,
                        "file_size": None,
                        "alt_text": "",
                        "category": "video",
                    })
    
    return assets



