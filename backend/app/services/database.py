"""
Database Service - SQLite database for storing scan logs and stats.
Uses aiosqlite for async access so FastAPI never blocks.
DB file: backend/deepweb.db
"""
import asyncio
import logging
import aiosqlite
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

# DB is stored next to main.py in the backend folder
DB_PATH = Path(__file__).parent.parent.parent / "deepweb.db"


async def init_db():
    """Create tables if they don't exist. Called on app startup."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id      TEXT NOT NULL UNIQUE,
                url         TEXT NOT NULL,
                domain      TEXT NOT NULL,
                status      TEXT NOT NULL DEFAULT 'started',
                pages_found INTEGER DEFAULT 0,
                started_at  TEXT NOT NULL,
                finished_at TEXT,
                duration_s  REAL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scan_logs (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id     TEXT NOT NULL,
                level      TEXT NOT NULL DEFAULT 'info',
                message    TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (job_id) REFERENCES scans(job_id)
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_scan_logs_job ON scan_logs(job_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_scans_started ON scans(started_at DESC)")
        await db.commit()
    logger.info(f"✓ Database ready at {DB_PATH}")


async def record_scan_started(job_id: str, url: str, domain: str):
    """Insert a new scan record when crawl begins."""
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT OR IGNORE INTO scans (job_id, url, domain, status, started_at)
                VALUES (?, ?, ?, 'running', ?)
            """, (job_id, url, domain, datetime.now().isoformat()))
            await db.commit()
    except Exception as e:
        logger.error(f"DB: Failed to record scan start: {e}")


async def record_scan_finished(job_id: str, status: str, pages_found: int, started_at: str):
    """Update scan record when crawl completes or fails."""
    try:
        finished = datetime.now()
        started = datetime.fromisoformat(started_at)
        duration = (finished - started).total_seconds()

        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                UPDATE scans
                SET status = ?, pages_found = ?, finished_at = ?, duration_s = ?
                WHERE job_id = ?
            """, (status, pages_found, finished.isoformat(), duration, job_id))
            await db.commit()
    except Exception as e:
        logger.error(f"DB: Failed to record scan finish: {e}")


async def add_scan_log(job_id: str, message: str, level: str = "info"):
    """Append a log line to scan_logs table."""
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO scan_logs (job_id, level, message, created_at)
                VALUES (?, ?, ?, ?)
            """, (job_id, level, message, datetime.now().isoformat()))
            await db.commit()
    except Exception as e:
        logger.error(f"DB: Failed to add log: {e}")


async def get_stats() -> Dict[str, Any]:
    """Return total scan count and recent scans list."""
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row

            # Total scans ever
            cursor = await db.execute("SELECT COUNT(*) as total FROM scans")
            row = await cursor.fetchone()
            total_scans = row["total"] if row else 0

            # Successful scans
            cursor = await db.execute("SELECT COUNT(*) as total FROM scans WHERE status = 'completed'")
            row = await cursor.fetchone()
            completed_scans = row["total"] if row else 0

            # Avg scan duration (completed only)
            cursor = await db.execute("SELECT AVG(duration_s) as avg FROM scans WHERE status = 'completed' AND duration_s IS NOT NULL")
            row = await cursor.fetchone()
            avg_duration = round(row["avg"] or 0, 1)

            # Recent 10 scans
            cursor = await db.execute("""
                SELECT job_id, url, domain, status, pages_found, started_at, duration_s
                FROM scans
                ORDER BY started_at DESC
                LIMIT 10
            """)
            rows = await cursor.fetchall()
            recent = [dict(r) for r in rows]

            return {
                "total_scans": total_scans,
                "completed_scans": completed_scans,
                "avg_duration_seconds": avg_duration,
                "recent_scans": recent,
            }
    except Exception as e:
        logger.error(f"DB: Failed to get stats: {e}")
        return {"total_scans": 0, "completed_scans": 0, "avg_duration_seconds": 0, "recent_scans": []}


async def get_scan_logs(job_id: str) -> List[Dict[str, Any]]:
    """Get all log lines for a specific scan from the database."""
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("""
                SELECT level, message, created_at
                FROM scan_logs
                WHERE job_id = ?
                ORDER BY id ASC
            """, (job_id,))
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"DB: Failed to get logs: {e}")
        return []
