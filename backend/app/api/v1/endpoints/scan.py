"""
Unified Scan Endpoint — Single API for the complete website analysis pipeline.
Replaces the old multi-endpoint approach with ONE start + SSE stream.

Endpoints:
  POST /scan/start     → Start a new scan, returns scan_id
  GET  /scan/status/{id} → Get current scan status (polling fallback)
  GET  /scan/stream/{id} → SSE stream for real-time progress
  GET  /scan/results/{id} → Get complete scan results
"""
import asyncio
import json
import uuid
import logging
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.scanner import run_unified_scan, active_scans, ScanProgress

logger = logging.getLogger(__name__)
router = APIRouter()


class ScanRequest(BaseModel):
    url: str
    max_pages: int = 300


@router.post("/start")
async def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """Start a unified website scan. Returns scan_id immediately."""
    url = str(request.url).strip()
    
    # Normalize URL
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    
    scan_id = str(uuid.uuid4())
    
    # Create scan progress tracker
    scan = ScanProgress(scan_id, url)
    active_scans[scan_id] = scan
    
    # Launch scan in background
    background_tasks.add_task(run_unified_scan, scan_id, url, request.max_pages)
    
    return {
        "scan_id": scan_id,
        "status": "started",
        "url": url,
    }


@router.get("/status/{scan_id}")
async def get_scan_status(scan_id: str):
    """Get current scan status (polling fallback for clients without SSE)."""
    if scan_id not in active_scans:
        raise HTTPException(status_code=404, detail="Scan not found")
    return active_scans[scan_id].to_dict()


@router.get("/stream/{scan_id}")
async def stream_scan_progress(scan_id: str):
    """Server-Sent Events stream for real-time scan progress.
    
    The client connects to this endpoint and receives live updates:
    - Phase changes (fetching, rendering, ai_analysis, complete)
    - Progress percentage
    - Log messages
    - Partial results as they become available
    """
    if scan_id not in active_scans:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    scan = active_scans[scan_id]
    queue = scan.add_listener()
    
    async def event_generator():
        try:
            # Send initial state
            yield f"data: {json.dumps(scan.to_dict())}\n\n"
            
            while True:
                try:
                    # Wait for updates with timeout
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(data)}\n\n"
                    
                    # If scan is done, send final results and close
                    if data.get("status") in ("completed", "failed"):
                        # Send full results as final event
                        final = scan.get_full_results()
                        yield f"event: complete\ndata: {json.dumps(final)}\n\n"
                        break
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield f": keepalive\n\n"
                    # Check if scan is done (in case we missed an event)
                    if scan.status in ("completed", "failed"):
                        final = scan.get_full_results()
                        yield f"event: complete\ndata: {json.dumps(final)}\n\n"
                        break
        finally:
            scan.remove_listener(queue)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/results/{scan_id}")
async def get_scan_results(scan_id: str):
    """Get complete scan results (only available after scan completes)."""
    if scan_id not in active_scans:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    scan = active_scans[scan_id]
    if scan.status not in ("completed", "failed"):
        return {
            "scan_id": scan_id,
            "status": scan.status,
            "message": "Scan still in progress. Use /stream/{scan_id} for live updates.",
        }
    
    return scan.get_full_results()
