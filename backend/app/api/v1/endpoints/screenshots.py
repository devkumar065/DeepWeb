"""
Screenshots Endpoints — Captures multi-viewport screenshots using Playwright
"""
import asyncio
import base64
import logging
import uuid
from typing import List, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright


logger = logging.getLogger(__name__)
router = APIRouter()

VIEWPORTS = {
    "desktop": {"width": 1920, "height": 1080},
    "laptop": {"width": 1440, "height": 900},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 390, "height": 844},
}

# In-memory screenshot store
screenshots_store = {}


class ScreenshotRequest(BaseModel):
    url: str
    job_id: Optional[str] = None
    viewports: Optional[List[str]] = None  # ["desktop", "tablet", "mobile"]
    full_page: bool = True


async def _capture_screenshots(url: str, viewports: List[str], full_page: bool) -> List[dict]:
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        for viewport_name in viewports:
            vp = VIEWPORTS.get(viewport_name, VIEWPORTS["desktop"])
            try:
                context = await browser.new_context(
                    viewport=vp,
                    user_agent="Mozilla/5.0 (compatible; WebIntelBot/1.0)",
                    device_scale_factor=2 if viewport_name == "mobile" else 1,
                )
                page = await context.new_page()
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(2000)

                # Regular screenshot
                screenshot_bytes = await page.screenshot(
                    full_page=False, type="png"
                )
                b64 = base64.b64encode(screenshot_bytes).decode()
                results.append({
                    "viewport": viewport_name,
                    "data_url": f"data:image/png;base64,{b64}",
                    "width": vp["width"],
                    "height": vp["height"],
                    "full_page": False,
                })

                # Full page screenshot
                if full_page:
                    full_bytes = await page.screenshot(full_page=True, type="png")
                    b64_full = base64.b64encode(full_bytes).decode()
                    results.append({
                        "viewport": f"{viewport_name}_fullpage",
                        "data_url": f"data:image/png;base64,{b64_full}",
                        "width": vp["width"],
                        "height": vp["height"],
                        "full_page": True,
                    })

                await context.close()
            except Exception as e:
                logger.warning(f"Screenshot failed for {viewport_name}: {e}")
                results.append({
                    "viewport": viewport_name,
                    "error": str(e),
                    "data_url": None,
                })

        await browser.close()
    return results


@router.post("/capture")
async def capture_screenshots(request: ScreenshotRequest):
    """Capture multi-viewport screenshots of a URL"""
    url = str(request.url)
    viewports = request.viewports or ["desktop", "tablet", "mobile"]
    job_id = request.job_id or str(uuid.uuid4())

    try:
        screenshots = await _capture_screenshots(url, viewports, request.full_page)
        screenshots_store[job_id] = {
            "url": url,
            "screenshots": screenshots,
        }
        return {
            "job_id": job_id,
            "url": url,
            "total": len(screenshots),
            "screenshots": screenshots,
        }
    except Exception as e:
        logger.error(f"Screenshot capture failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}")
async def get_screenshots(job_id: str):
    """Get screenshots for a job"""
    if job_id not in screenshots_store:
        raise HTTPException(status_code=404, detail="Screenshots not found")
    return screenshots_store[job_id]
