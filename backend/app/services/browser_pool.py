"""
Browser Pool — Singleton Playwright browser manager.
Maintains ONE persistent Chromium instance for the entire app lifecycle.
Creating a new browser context (~50ms) vs launching a browser (~5-8s).
"""
import asyncio
import logging
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, BrowserContext, Playwright

logger = logging.getLogger(__name__)


class BrowserPool:
    """Manages a single Playwright Chromium browser instance.
    
    Usage:
        pool = BrowserPool()
        await pool.initialize()
        context = await pool.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()
        # ... use page ...
        await context.close()
        # At shutdown:
        await pool.cleanup()
    """
    
    def __init__(self):
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._lock = asyncio.Lock()
        self._initialized = False
    
    async def initialize(self):
        """Start Playwright and launch a persistent Chromium browser.
        Called once at application startup."""
        async with self._lock:
            if self._initialized:
                return
            try:
                self._playwright = await async_playwright().start()
                self._browser = await self._playwright.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--disable-extensions",
                        "--disable-background-networking",
                        "--disable-default-apps",
                        "--disable-sync",
                        "--no-first-run",
                    ]
                )
                self._initialized = True
                logger.info("✓ Browser pool initialized — Chromium ready")
            except Exception as e:
                logger.error(f"Failed to initialize browser pool: {e}")
                raise
    
    async def _ensure_browser(self) -> Browser:
        """Ensure the browser is running, re-launch if crashed."""
        if not self._initialized or self._browser is None or not self._browser.is_connected():
            self._initialized = False
            await self.initialize()
        return self._browser
    
    async def new_context(
        self,
        viewport: Optional[Dict[str, int]] = None,
        user_agent: str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        device_scale_factor: int = 1,
        **kwargs: Any,
    ) -> BrowserContext:
        """Create a new browser context (lightweight, ~50ms).
        Each context is isolated (cookies, storage, etc.).
        Caller is responsible for closing it."""
        browser = await self._ensure_browser()
        context = await browser.new_context(
            viewport=viewport or {"width": 1920, "height": 1080},
            user_agent=user_agent,
            device_scale_factor=device_scale_factor,
            **kwargs,
        )
        return context
    
    async def cleanup(self):
        """Shutdown browser and Playwright. Called at application shutdown."""
        async with self._lock:
            if self._browser:
                try:
                    await self._browser.close()
                except Exception as e:
                    logger.warning(f"Error closing browser: {e}")
                self._browser = None
            if self._playwright:
                try:
                    await self._playwright.stop()
                except Exception as e:
                    logger.warning(f"Error stopping Playwright: {e}")
                self._playwright = None
            self._initialized = False
            logger.info("✓ Browser pool cleaned up")
    
    @property
    def is_ready(self) -> bool:
        return self._initialized and self._browser is not None and self._browser.is_connected()


# Global singleton
browser_pool = BrowserPool()
