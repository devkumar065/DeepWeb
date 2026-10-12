"""
Crawl Endpoints — Manages crawl jobs and page discovery.
Every scan is saved to the SQLite database for persistent stats.
"""
import asyncio
import uuid
import logging
from datetime import datetime
from typing import Dict, Any
from urllib.parse import urlparse
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.schemas import CrawlRequest, CrawlStatus, DiscoveredPage
from app.services.crawler import crawler_service
from app.services import database as db

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory job store (active jobs only — history is in SQLite)
jobs: Dict[str, Any] = {}


def _get_domain(url: str) -> str:
    """Extract clean domain from URL."""
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return url


def _init_job(job_id: str, url: str, max_pages: int) -> Dict:
    return {
        "job_id": job_id,
        "url": url,
        "max_pages": max_pages,
        "status": "pending",
        "progress": 0.0,
        "pages_found": 0,
        "pages_crawled": 0,
        "total_pages": 0,
        "logs": [f"[{datetime.now().strftime('%H:%M:%S')}] Scan started for {url}"],
        "pages": [],
        "error": None,
        "created_at": datetime.now().isoformat(),
    }


async def _run_crawl(job_id: str):
    job = jobs[job_id]
    url = job["url"]
    started_at = job["created_at"]
    domain = _get_domain(url)

    try:
        job["status"] = "running"
        msg = f"[{datetime.now().strftime('%H:%M:%S')}] Starting page discovery..."
        job["logs"].append(msg)
        # Save log to DB
        await db.add_scan_log(job_id, msg)

        pages = await crawler_service.discover_pages(
            base_url=url,
            max_pages=job["max_pages"],
            job_id=job_id,
            jobs_store=jobs,
        )

        job["pages"] = [p.model_dump() for p in pages]
        job["pages_found"] = len(pages)
        job["total_pages"] = len(pages)
        job["progress"] = 100.0
        job["status"] = "completed"

        done_msg = f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Scan complete — {len(pages)} pages found"
        job["logs"].append(done_msg)

        # Save all logs to DB
        await db.add_scan_log(job_id, done_msg)
        await db.record_scan_finished(job_id, "completed", len(pages), started_at)

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        err_msg = f"[{datetime.now().strftime('%H:%M:%S')}] ✗ Error: {e}"
        job["logs"].append(err_msg)
        await db.add_scan_log(job_id, err_msg, level="error")
        await db.record_scan_finished(job_id, "failed", job.get("pages_found", 0), started_at)
        logger.error(f"Crawl failed for job {job_id}: {e}")


@router.post("/start", response_model=Dict[str, str])
async def start_crawl(request: CrawlRequest, background_tasks: BackgroundTasks):
    """Start a new website scan. Returns job_id immediately, scan runs in background."""
    job_id = str(uuid.uuid4())
    url = str(request.url)
    domain = _get_domain(url)

    jobs[job_id] = _init_job(job_id, url, request.max_pages)

    # Save to database immediately so it counts in stats
    await db.record_scan_started(job_id, url, domain)
    await db.add_scan_log(job_id, f"Scan started for {url}")

    background_tasks.add_task(_run_crawl, job_id)
    return {"job_id": job_id, "status": "started"}


@router.get("/status/{job_id}", response_model=CrawlStatus)
async def get_crawl_status(job_id: str):
    """Get real-time status and progress of a running scan."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs[job_id]
    return CrawlStatus(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        pages_found=job["pages_found"],
        pages_crawled=job["pages_crawled"],
        total_pages=job["total_pages"],
        logs=job["logs"][-50:],  # last 50 logs
        pages=[DiscoveredPage(**p) for p in job["pages"]],
        error=job.get("error"),
    )


@router.get("/pages/{job_id}")
async def get_crawled_pages(job_id: str):
    """Get all discovered pages for a completed scan."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs[job_id]
    return {
        "job_id": job_id,
        "total": len(job["pages"]),
        "pages": job["pages"],
    }


@router.get("/logs/{job_id}")
async def get_scan_logs_from_db(job_id: str):
    """Get all logs for a scan from the database (persisted even after server restart)."""
    logs = await db.get_scan_logs(job_id)
    return {"job_id": job_id, "logs": logs, "total": len(logs)}


@router.delete("/{job_id}")
async def cancel_crawl(job_id: str):
    """Cancel/delete a running scan."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    jobs[job_id]["status"] = "cancelled"
    await db.record_scan_finished(job_id, "cancelled", jobs[job_id].get("pages_found", 0), jobs[job_id]["created_at"])
    return {"message": "Scan cancelled"}
