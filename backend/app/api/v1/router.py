from fastapi import APIRouter
from app.api.v1.endpoints import analysis, crawl, screenshots, assets, export, stats, scan, network, report

api_router = APIRouter()
api_router.include_router(crawl.router, prefix="/crawl", tags=["Crawl"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(screenshots.router, prefix="/screenshots", tags=["Screenshots"])
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_router.include_router(export.router, prefix="/export", tags=["Export"])
api_router.include_router(stats.router, prefix="/stats", tags=["Stats"])
api_router.include_router(scan.router, prefix="/scan", tags=["Scan"])
api_router.include_router(network.router, prefix="/network", tags=["Network & Security"])
api_router.include_router(report.router, prefix="/report", tags=["Report"])
