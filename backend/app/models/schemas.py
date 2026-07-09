"""
Pydantic models for the Website Intelligence Platform
"""
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
from enum import Enum


class PageType(str, Enum):
    HOMEPAGE = "homepage"
    ABOUT = "about"
    SERVICES = "services"
    PRICING = "pricing"
    BLOG = "blog"
    PORTFOLIO = "portfolio"
    CASE_STUDIES = "case_studies"
    CAREERS = "careers"
    CONTACT = "contact"
    TERMS = "terms"
    PRIVACY = "privacy"
    CUSTOM = "custom"


class CrawlRequest(BaseModel):
    url: str
    max_pages: int = 100


class DiscoveredPage(BaseModel):
    url: str
    title: Optional[str] = None
    type: PageType = PageType.CUSTOM
    depth: int = 0
    status_code: Optional[int] = None


class CrawlStatus(BaseModel):
    job_id: str
    status: str  # pending, running, completed, failed
    progress: float = 0.0
    pages_found: int = 0
    pages_crawled: int = 0
    total_pages: int = 0
    logs: List[str] = []
    pages: List[DiscoveredPage] = []
    error: Optional[str] = None


class BrandColor(BaseModel):
    hex: str
    rgb: str
    hsl: str
    name: Optional[str] = None
    usage: Optional[str] = None  # primary, secondary, accent, background, text


class Font(BaseModel):
    family: str
    weights: List[str] = []
    variants: List[str] = []
    source: Optional[str] = None  # google, local, cdn


class DesignTokens(BaseModel):
    colors: List[BrandColor] = []
    fonts: List[Font] = []
    border_radius: List[str] = []
    spacing: List[str] = []
    shadows: List[str] = []


class NavItem(BaseModel):
    label: str
    url: Optional[str] = None
    children: List["NavItem"] = []


NavItem.model_rebuild()


class NavigationData(BaseModel):
    navbar: List[NavItem] = []
    footer: List[NavItem] = []
    breadcrumbs: List[str] = []


class SEOData(BaseModel):
    title: Optional[str] = None
    meta_description: Optional[str] = None
    canonical: Optional[str] = None
    robots: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    og_type: Optional[str] = None
    twitter_card: Optional[str] = None
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    hreflang: List[Dict[str, str]] = []
    keywords: List[str] = []
    structured_data: List[Dict[str, Any]] = []
    schema_types: List[str] = []
    sitemap_url: Optional[str] = None


class Technology(BaseModel):
    name: str
    category: str  # frontend, backend, cms, cdn, analytics, hosting, payment, etc.
    confidence: int  # 0-100
    version: Optional[str] = None
    icon: Optional[str] = None


class SocialMedia(BaseModel):
    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    youtube: Optional[str] = None
    github: Optional[str] = None
    discord: Optional[str] = None
    tiktok: Optional[str] = None
    pinterest: Optional[str] = None
    threads: Optional[str] = None


class ContactInfo(BaseModel):
    emails: List[str] = []
    phones: List[str] = []
    address: Optional[str] = None
    google_maps_url: Optional[str] = None
    calendly_url: Optional[str] = None
    whatsapp_url: Optional[str] = None


class WebsiteOverview(BaseModel):
    url: str
    title: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    domain_age: Optional[str] = None
    favicon: Optional[str] = None
    language: Optional[str] = None
    cms: Optional[str] = None
    framework: Optional[str] = None
    hosting: Optional[str] = None
    cdn: Optional[str] = None
    analytics: List[str] = []
    seo_score: Optional[int] = None


class Asset(BaseModel):
    type: str  # image, svg, video, gif, lottie, icon, illustration
    url: str
    filename: str
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    alt_text: Optional[str] = None
    category: Optional[str] = None  # hero, gallery, product, background, logo
    format: Optional[str] = None  # png, jpg, webp, svg, gif, mp4


class Screenshot(BaseModel):
    viewport: str  # desktop, tablet, mobile, fullpage
    url: str
    width: int
    height: int
    storage_path: Optional[str] = None


class ContentSection(BaseModel):
    section: str
    data: Any


class FullAnalysis(BaseModel):
    job_id: str
    url: str
    overview: Optional[WebsiteOverview] = None
    design: Optional[DesignTokens] = None
    navigation: Optional[NavigationData] = None
    seo: Optional[SEOData] = None
    technologies: List[Technology] = []
    social_media: Optional[SocialMedia] = None
    contacts: Optional[ContactInfo] = None
    assets: List[Asset] = []
    screenshots: List[Screenshot] = []
    content: List[ContentSection] = []
    pages: List[DiscoveredPage] = []


class AIAnalysisRequest(BaseModel):
    url: str
    job_id: str
    analysis_data: Dict[str, Any]


class AIAnalysisResult(BaseModel):
    business_type: str
    target_audience: str
    strengths: List[str]
    weaknesses: List[str]
    missing_pages: List[str]
    seo_issues: List[str]
    accessibility_issues: List[str]
    performance_issues: List[str]
    suggestions: List[str]
    overall_score: int
    redesign_suggestions: str


class ExportRequest(BaseModel):
    job_id: str
    format: str  # json, csv, markdown, html, zip
    include_assets: bool = False
    include_screenshots: bool = False
