"""
Crawler Service — Discovers all pages on a website.
Uses Playwright to crawl the website.
"""
import asyncio
import logging
import re
import xml.etree.ElementTree as ET
from urllib.parse import urljoin, urlparse, urlencode
from typing import List, Set, Dict, Optional, Tuple
import httpx
from playwright.async_api import async_playwright, Browser, Page
from bs4 import BeautifulSoup
from app.models.schemas import DiscoveredPage, PageType

logger = logging.getLogger(__name__)

PAGE_TYPE_PATTERNS: Dict[PageType, List[str]] = {
    PageType.HOMEPAGE: [r"^/?$", r"^/home/?$", r"^/index"],
    PageType.ABOUT: [r"/about", r"/who-we-are", r"/our-story", r"/team", r"/company"],
    PageType.SERVICES: [r"/services", r"/solutions", r"/offerings", r"/what-we-do", r"/products"],
    PageType.PRICING: [r"/pricing", r"/plans", r"/packages", r"/rates"],
    PageType.BLOG: [r"/blog", r"/news", r"/articles", r"/posts", r"/insights", r"/resources"],
    PageType.PORTFOLIO: [r"/portfolio", r"/work", r"/projects", r"/showcase", r"/gallery"],
    PageType.CASE_STUDIES: [r"/case-studies", r"/case-study", r"/success-stories", r"/clients"],
    PageType.CAREERS: [r"/careers", r"/jobs", r"/hiring", r"/work-with-us", r"/join"],
    PageType.CONTACT: [r"/contact", r"/get-in-touch", r"/reach-us", r"/connect"],
    PageType.TERMS: [r"/terms", r"/tos", r"/terms-of-service", r"/terms-and-conditions"],
    PageType.PRIVACY: [r"/privacy", r"/privacy-policy", r"/data-policy", r"/gdpr"],
}


class CrawlerService:
    def __init__(self):
        self.browser: Optional[Browser] = None

    async def get_browser(self) -> Browser:
        if self.browser is None or not self.browser.is_connected():
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
        return self.browser

    def categorize_page(self, url: str, title: str = "") -> PageType:
        parsed = urlparse(url)
        path = parsed.path.lower()
        for page_type, patterns in PAGE_TYPE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, path, re.IGNORECASE):
                    return page_type
        if path in ["", "/"]:
            return PageType.HOMEPAGE
        return PageType.CUSTOM

    async def parse_sitemap(self, base_url: str) -> List[str]:
        urls = []
        sitemap_urls = [
            urljoin(base_url, "/sitemap.xml"),
            urljoin(base_url, "/sitemap_index.xml"),
            urljoin(base_url, "/sitemap/sitemap.xml"),
        ]
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            for sitemap_url in sitemap_urls:
                try:
                    resp = await client.get(sitemap_url, headers={"User-Agent": "WebIntelBot/1.0"})
                    if resp.status_code == 200:
                        root = ET.fromstring(resp.text)
                        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
                        # Handle sitemap index
                        for sitemap in root.findall("sm:sitemap/sm:loc", ns):
                            child_urls = await self._fetch_sitemap_child(client, sitemap.text)
                            urls.extend(child_urls)
                        # Handle regular sitemap
                        for loc in root.findall("sm:url/sm:loc", ns):
                            urls.append(loc.text)
                        if urls:
                            break
                except Exception as e:
                    logger.debug(f"Sitemap fetch failed for {sitemap_url}: {e}")
        return list(set(urls))

    async def _fetch_sitemap_child(self, client: httpx.AsyncClient, url: str) -> List[str]:
        try:
            resp = await client.get(url, headers={"User-Agent": "WebIntelBot/1.0"}, timeout=15.0)
            if resp.status_code == 200:
                root = ET.fromstring(resp.text)
                ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
                return [loc.text for loc in root.findall("sm:url/sm:loc", ns)]
        except Exception:
            pass
        return []

    async def parse_robots(self, base_url: str) -> List[str]:
        sitemap_urls = []
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
                resp = await client.get(
                    urljoin(base_url, "/robots.txt"),
                    headers={"User-Agent": "WebIntelBot/1.0"}
                )
                if resp.status_code == 200:
                    for line in resp.text.splitlines():
                        if line.lower().startswith("sitemap:"):
                            sitemap_url = line.split(":", 1)[1].strip()
                            sitemap_urls.append(sitemap_url)
        except Exception as e:
            logger.debug(f"Robots.txt parse failed: {e}")
        return sitemap_urls

    async def extract_links(self, page: Page, base_url: str) -> List[str]:
        parsed_base = urlparse(base_url)
        base_domain = parsed_base.netloc

        links = await page.evaluate("""
            () => {
                const links = new Set();
                document.querySelectorAll('a[href]').forEach(a => {
                    try { links.add(new URL(a.href, window.location.href).href); } catch(e) {}
                });
                return Array.from(links);
            }
        """)

        internal = []
        for link in links:
            try:
                parsed = urlparse(link)
                if parsed.netloc == base_domain and parsed.scheme in ["http", "https"]:
                    clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                    if not any(ext in clean for ext in [".pdf", ".jpg", ".png", ".gif", ".zip", ".css", ".js"]):
                        internal.append(clean)
            except Exception:
                pass
        return list(set(internal))

    async def crawl_with_playwright(
        self,
        base_url: str,
        max_pages: int,
        job_id: str,
        jobs_store: Dict,
    ) -> List[DiscoveredPage]:
        visited: Set[str] = set()
        to_visit: List[Tuple[str, int]] = [(base_url, 0)]
        pages: List[DiscoveredPage] = []

        jobs_store[job_id]["logs"].append(f"[Playwright] Starting crawl of {base_url}")

        try:
            browser = await self.get_browser()
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (compatible; WebIntelBot/1.0)",
                viewport={"width": 1920, "height": 1080},
            )

            try:
                # First: parse sitemap
                jobs_store[job_id]["logs"].append("Checking sitemap.xml...")
                sitemap_urls = await self.parse_sitemap(base_url)
                if sitemap_urls:
                    jobs_store[job_id]["logs"].append(f"Found {len(sitemap_urls)} URLs in sitemap")
                    for u in sitemap_urls[:max_pages]:
                        if u not in visited:
                            to_visit.append((u, 1))

                # Check robots.txt for additional sitemaps
                robot_sitemaps = await self.parse_robots(base_url)
                for sm in robot_sitemaps:
                    child_urls = await self._fetch_sitemap_child(
                        httpx.AsyncClient(), sm
                    )
                    for u in child_urls:
                        if u not in visited:
                            to_visit.append((u, 1))

                # Crawl pages
                while to_visit and len(pages) < max_pages:
                    url, depth = to_visit.pop(0)
                    if url in visited or depth > 5:
                        continue
                    visited.add(url)

                    page = None
                    try:
                        page = await context.new_page()
                        jobs_store[job_id]["logs"].append(f"Crawling [{len(pages)+1}]: {url}")

                        await page.goto(url, wait_until="domcontentloaded", timeout=10000)
                        title = await page.title()
                        page_type = self.categorize_page(url, title)

                        discovered = DiscoveredPage(
                            url=url,
                            title=title,
                            type=page_type,
                            depth=depth,
                            status_code=200,
                        )
                        pages.append(discovered)

                        jobs_store[job_id]["pages_found"] = len(pages)
                        jobs_store[job_id]["progress"] = min(95, (len(pages) / max_pages) * 100)

                        # Extract links for further crawling
                        if depth < 3:
                            new_links = await self.extract_links(page, base_url)
                            for link in new_links:
                                if link not in visited:
                                    to_visit.append((link, depth + 1))

                    except Exception as e:
                        logger.warning(f"Failed to crawl {url}: {e}")
                        jobs_store[job_id]["logs"].append(f"⚠ Failed: {url} — {str(e)[:80]}")
                    finally:
                        if page:
                            await page.close()

            finally:
                if context:
                    await context.close()

        except Exception as e:
            logger.error(f"Playwright crawl error: {e}")
            jobs_store[job_id]["logs"].append(f"✗ Crawl error: {e}")

        return pages

    async def discover_pages(
        self,
        base_url: str,
        max_pages: int,
        job_id: str,
        jobs_store: Dict,
    ) -> List[DiscoveredPage]:
        """Main entry point: crawls using Playwright"""
        return await self.crawl_with_playwright(base_url, max_pages, job_id, jobs_store)




crawler_service = CrawlerService()
