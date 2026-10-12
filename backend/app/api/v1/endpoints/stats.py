"""
Stats Endpoint — Returns total scan count and recent scans from the SQLite database.
Used by the frontend homepage to show "X scans done so far".
"""
from fastapi import APIRouter
from app.services import database as db

router = APIRouter()


@router.get("/")
async def get_stats():
    """
    Get global scan statistics from the database.
    Returns: total scans, completed scans, avg duration, recent 10 scans.
    """
    return await db.get_stats()
