from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class NetworkScanRequest(BaseModel):
    url: str

@router.post("/scan")
async def scan_network(request: NetworkScanRequest):
    """Run comprehensive network & security scan for a URL"""
    from app.services.network_scanner import scan_network_security
    try:
        results = await scan_network_security(request.url)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
