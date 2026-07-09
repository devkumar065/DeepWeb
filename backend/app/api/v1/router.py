from fastapi import APIRouter
from app.api.v1.endpoints import analysis, crawl, screenshots, assets, ai_analysis, export

api_router = APIRouter()
api_router.include_router(crawl.router, prefix="/crawl", tags=["Crawl"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(screenshots.router, prefix="/screenshots", tags=["Screenshots"])
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(ai_analysis.router, prefix="/ai", tags=["AI"])
api_router.include_router(export.router, prefix="/export", tags=["Export"])
