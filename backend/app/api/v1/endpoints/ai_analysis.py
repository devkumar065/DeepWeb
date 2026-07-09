"""
AI Analysis Endpoints — Groq-powered website intelligence analysis
Model: llama-3.3-70b-versatile (fast + free)
"""
import logging
import json
import re
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

ai_cache: Dict[str, Any] = {}


class AIAnalysisRequest(BaseModel):
    url: str
    job_id: Optional[str] = None
    analysis_data: Optional[Dict[str, Any]] = None
    html_content: Optional[str] = None


class RedesignRequest(BaseModel):
    url: str
    job_id: Optional[str] = None
    style: str = "apple"
    analysis_data: Optional[Dict[str, Any]] = None


ANALYSIS_PROMPT = """You are a world-class website intelligence analyst. Analyze this website data and respond ONLY with valid JSON.

Website URL: {url}

Data:
{data}

Respond ONLY with this exact JSON format (no extra text):
{{
  "business_type": "specific business type and industry",
  "target_audience": "detailed target audience description",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "missing_pages": ["missing page 1", "missing page 2"],
  "seo_issues": ["seo issue 1", "seo issue 2"],
  "accessibility_issues": ["accessibility issue 1"],
  "performance_issues": ["performance issue 1"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "overall_score": 72,
  "redesign_suggestions": "detailed redesign recommendations here"
}}"""

REDESIGN_PROMPT = """You are a world-class UI/UX designer. Generate a redesign spec for this website in {style} style.

URL: {url}
Data: {data}

Respond ONLY with valid JSON:
{{
  "design_concept": "description of redesign concept",
  "color_palette": {{
    "primary": "#000000",
    "secondary": "#ffffff",
    "accent": "#333333",
    "background": "#fafafa",
    "text": "#111111"
  }},
  "typography": {{
    "heading_font": "Inter",
    "body_font": "Inter",
    "scale": "description"
  }},
  "hero_component": "JSX code as string",
  "design_tokens": {{}},
  "page_structure": ["Hero", "Features", "Pricing", "Testimonials", "CTA", "Footer"],
  "animations": "description of motion design"
}}"""


def _call_groq(prompt: str) -> str:
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set in .env file")

    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a website intelligence analyst. Always respond with valid JSON only. No markdown, no explanation, just raw JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
        max_tokens=4096,
    )
    return response.choices[0].message.content


def _parse_json(text: str) -> Dict[str, Any]:
    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass
    # Try extracting JSON block
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        return json.loads(match.group(0))
    raise ValueError("Groq response mein valid JSON nahi mila")


@router.post("/analyze")
async def ai_analyze(request: AIAnalysisRequest):
    """Groq se website ka AI analysis karo"""
    url = str(request.url)
    job_id = request.job_id or url

    if job_id in ai_cache:
        return ai_cache[job_id]

    data_str = json.dumps(request.analysis_data or {}, indent=2)[:6000]
    prompt = ANALYSIS_PROMPT.format(url=url, data=data_str)

    try:
        raw = _call_groq(prompt)
        result = _parse_json(raw)
        result["url"] = url
        result["job_id"] = job_id
        result["model"] = "llama-3.3-70b-versatile"
        ai_cache[job_id] = result
        return result
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/redesign")
async def ai_redesign(request: RedesignRequest):
    """Groq se redesign suggestions generate karo"""
    url = str(request.url)
    data_str = json.dumps(request.analysis_data or {}, indent=2)[:4000]
    prompt = REDESIGN_PROMPT.format(url=url, style=request.style, data=data_str)

    try:
        raw = _call_groq(prompt)
        result = _parse_json(raw)
        result["url"] = url
        result["style"] = request.style
        result["model"] = "llama-3.3-70b-versatile"
        return result
    except Exception as e:
        logger.error(f"Redesign failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/content")
async def extract_content_with_ai(request: AIAnalysisRequest):
    """Groq se page content extract karo"""
    prompt = f"""Extract ALL content from this webpage. Return structured JSON only.

URL: {request.url}
HTML: {(request.html_content or "")[:8000]}

JSON format:
{{
  "hero": {{"title": "", "subtitle": "", "buttons": []}},
  "headings": [],
  "paragraphs": [],
  "services": [],
  "features": [],
  "pricing": [],
  "testimonials": [],
  "team": [],
  "faqs": [],
  "statistics": [],
  "cta": [],
  "footer": {{"links": [], "copyright": ""}}
}}

Rules: Do NOT summarize. Extract EXACT text. Preserve order."""

    try:
        raw = _call_groq(prompt)
        result = _parse_json(raw)
        return {"url": request.url, "content": result, "model": "llama-3.3-70b-versatile"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
