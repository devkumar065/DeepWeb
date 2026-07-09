"""
Crawl Endpoints — Manages crawl jobs and page discovery
"""
import asyncio
import uuid
import logging
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.schemas import CrawlRequest, CrawlStatus, DiscoveredPage
from app.services.crawler import crawler_service

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory job store (use Redis in production)
jobs: Dict[str, Any] = {}


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
        "logs": [f"[{datetime.now().strftime('%H:%M:%S')}] Job created for {url}"],
        "pages": [],
        "error": None,
        "created_at": datetime.now().isoformat(),
    }


async def _run_crawl(job_id: str):
    job = jobs[job_id]
    try:
        job["status"] = "running"
        job["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Starting discovery...")

        pages = await crawler_service.discover_pages(
            base_url=job["url"],
            max_pages=job["max_pages"],
            job_id=job_id,
            jobs_store=jobs,
        )

        job["pages"] = [p.model_dump() for p in pages]
        job["pages_found"] = len(pages)
        job["total_pages"] = len(pages)
        job["progress"] = 100.0
        job["status"] = "completed"
        job["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Crawl complete — {len(pages)} pages found")

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] ✗ Error: {e}")
        logger.error(f"Crawl failed for job {job_id}: {e}")


@router.post("/start", response_model=Dict[str, str])
async def start_crawl(request: CrawlRequest, background_tasks: BackgroundTasks):
    """Start a new crawl job"""
    job_id = str(uuid.uuid4())
    jobs[job_id] = _init_job(job_id, str(request.url), request.max_pages)
    background_tasks.add_task(_run_crawl, job_id)
    return {"job_id": job_id, "status": "started"}


@router.get("/status/{job_id}", response_model=CrawlStatus)
async def get_crawl_status(job_id: str):
    """Get crawl job status and progress"""
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
    """Get all discovered pages for a job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    job = jobs[job_id]
    return {
        "job_id": job_id,
        "total": len(job["pages"]),
        "pages": job["pages"],
    }


@router.delete("/{job_id}")
async def cancel_crawl(job_id: str):
    """Cancel/delete a crawl job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    jobs[job_id]["status"] = "cancelled"
    return {"message": "Job cancelled"}
