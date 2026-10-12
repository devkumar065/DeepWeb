"""
Export Endpoints - Download analysis data as a ZIP file
The ZIP is named after the website and contains all reports + AI analysis
"""
import csv
import io
import json
import logging
import zipfile
import re
from datetime import datetime
from typing import Dict, Any, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class ExportRequest(BaseModel):
    job_id: str
    url: str
    data: Dict[str, Any]
    format: str = "zip"
    include_assets: bool = False


def _get_site_name(url: str) -> str:
    """Extract a clean website name from URL for the zip filename."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.replace("www.", "")
        # Remove port if present
        domain = domain.split(":")[0]
        # Clean up to make a safe filename
        safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', domain)
        return safe_name or "deepweb_export"
    except Exception:
        return "deepweb_export"


def _to_markdown(data: Dict[str, Any], url: str) -> str:
    """Generate a readable Markdown report of the analysis."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        f"# DeepWeb Analysis Report",
        f"",
        f"**Website:** {url}",
        f"**Scanned:** {now}",
        f"",
        f"---",
        f"",
    ]

    overview = data.get("overview", {})
    if overview:
        lines += [
            "## Website Overview",
            f"- **Title:** {overview.get('title', 'N/A')}",
            f"- **Framework:** {overview.get('framework', 'N/A')}",
            f"- **CMS:** {overview.get('cms', 'N/A')}",
            f"- **CDN:** {overview.get('cdn', 'N/A')}",
            f"- **Hosting:** {overview.get('hosting', 'N/A')}",
            f"- **Domain Age:** {overview.get('domain_age', 'N/A')}",
            f"- **Language:** {overview.get('language', 'N/A')}",
            f"",
        ]

    seo = data.get("seo", {})
    if seo:
        lines += [
            "## SEO Analysis",
            f"- **Meta Description:** {seo.get('meta_description', 'N/A')}",
            f"- **Canonical:** {seo.get('canonical', 'N/A')}",
            f"- **OG Title:** {seo.get('og_title', 'N/A')}",
            f"- **Twitter Card:** {seo.get('twitter_card', 'N/A')}",
            f"- **Schema Types:** {', '.join(seo.get('schema_types', []))}",
            f"",
        ]

    technologies = data.get("technologies", [])
    if technologies:
        lines.append("## Technologies Detected")
        for tech in technologies:
            lines.append(f"- **{tech.get('name')}** ({tech.get('category')}) — {tech.get('confidence')}% confidence")
        lines.append("")

    social = data.get("social_media", {})
    if social:
        lines.append("## Social Media Profiles")
        for platform, link in social.items():
            if link:
                lines.append(f"- **{platform.title()}:** {link}")
        lines.append("")

    contacts = data.get("contacts", {})
    if contacts:
        lines.append("## Contact Information")
        for email in contacts.get("emails", []):
            lines.append(f"- **Email:** {email}")
        for phone in contacts.get("phones", []):
            lines.append(f"- **Phone:** {phone}")
        if contacts.get("address"):
            lines.append(f"- **Address:** {contacts['address']}")
        lines.append("")

    pages = data.get("pages", [])
    if pages:
        lines.append("## Discovered Pages")
        for page in pages:
            lines.append(f"- [{page.get('url')}]({page.get('url')}) — {page.get('type', 'custom')}")
        lines.append("")

    return "\n".join(lines)


def _to_subdomains_txt(data: Dict[str, Any], base_url: str) -> str:
    """
    Generate a text file listing all discovered subdomains and pages.
    Each subdomain is on its own line.
    """
    pages = data.get("pages", [])
    base_domain = urlparse(base_url).netloc.replace("www.", "")

    lines = [
        f"DeepWeb - Subdomain & Page Discovery",
        f"Base URL: {base_url}",
        f"Base Domain: {base_domain}",
        f"Scanned: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"Total Pages Found: {len(pages)}",
        "",
        "=" * 60,
        "SUBDOMAINS FOUND",
        "=" * 60,
    ]

    subdomains_seen = set()
    for page in pages:
        page_url = page.get("url", "")
        try:
            parsed = urlparse(page_url)
            netloc = parsed.netloc
            if netloc and netloc != base_domain and netloc not in subdomains_seen:
                if base_domain in netloc:
                    subdomains_seen.add(netloc)
                    lines.append(f"  {netloc}")
        except Exception:
            pass

    if not subdomains_seen:
        lines.append("  No subdomains found (all pages are on the same domain)")

    lines += [
        "",
        "=" * 60,
        "ALL PAGES DISCOVERED",
        "=" * 60,
    ]

    for page in pages:
        title = page.get("title", "No title")
        page_type = page.get("type", "page")
        page_url = page.get("url", "")
        lines.append(f"  [{page_type.upper()}] {page_url}")
        if title:
            lines.append(f"    Title: {title}")

    return "\n".join(lines)


def _to_ai_report_txt(ai_data: Dict[str, Any], url: str) -> str:
    """Generate a plain text AI analysis report."""
    lines = [
        "DeepWeb - AI Analysis Report",
        f"Website: {url}",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"AI Model: {ai_data.get('model', 'N/A')}",
        "",
        "=" * 60,
    ]

    if ai_data.get("business_type"):
        lines += [
            "",
            "BUSINESS TYPE",
            "-" * 40,
            ai_data.get("business_type", ""),
        ]

    if ai_data.get("target_audience"):
        lines += [
            "",
            "TARGET AUDIENCE",
            "-" * 40,
            ai_data.get("target_audience", ""),
        ]

    overall_score = ai_data.get("overall_score")
    if overall_score is not None:
        lines += [
            "",
            "OVERALL SCORE",
            "-" * 40,
            f"{overall_score}/100",
        ]

    strengths = ai_data.get("strengths", [])
    if strengths:
        lines += ["", "STRENGTHS", "-" * 40]
        for s in strengths:
            lines.append(f"  + {s}")

    weaknesses = ai_data.get("weaknesses", [])
    if weaknesses:
        lines += ["", "WEAKNESSES", "-" * 40]
        for w in weaknesses:
            lines.append(f"  - {w}")

    seo_issues = ai_data.get("seo_issues", [])
    if seo_issues:
        lines += ["", "SEO ISSUES", "-" * 40]
        for s in seo_issues:
            lines.append(f"  ! {s}")

    suggestions = ai_data.get("suggestions", [])
    if suggestions:
        lines += ["", "IMPROVEMENT SUGGESTIONS", "-" * 40]
        for s in suggestions:
            lines.append(f"  > {s}")

    if ai_data.get("redesign_suggestions"):
        lines += [
            "",
            "REDESIGN RECOMMENDATIONS",
            "-" * 40,
            ai_data.get("redesign_suggestions", ""),
        ]

    lines += ["", "=" * 60, "End of AI Report"]
    return "\n".join(lines)


def _to_csv(data: Dict[str, Any]) -> str:
    """Generate a CSV export with all key data."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Section", "Key", "Value"])
    overview = data.get("overview", {})
    for k, v in overview.items():
        writer.writerow(["Overview", k, str(v)])
    writer.writerow([])

    writer.writerow(["Technologies", "Name", "Category", "Confidence"])
    for tech in data.get("technologies", []):
        writer.writerow(["Technology", tech.get("name"), tech.get("category"), tech.get("confidence")])
    writer.writerow([])

    writer.writerow(["Pages", "URL", "Title", "Type", "Depth"])
    for page in data.get("pages", []):
        writer.writerow(["Page", page.get("url"), page.get("title"), page.get("type"), page.get("depth")])
    writer.writerow([])

    writer.writerow(["Social", "Platform", "URL"])
    for platform, link in data.get("social_media", {}).items():
        if link:
            writer.writerow(["Social", platform, link])

    return output.getvalue()


def _to_screenshots_readme(screenshots: list) -> str:
    """Generate a README for the screenshots folder."""
    lines = [
        "DeepWeb Screenshots",
        "=" * 40,
        f"Total Screenshots: {len(screenshots)}",
        "",
        "Screenshots are saved as base64 data URLs.",
        "To view them, open the main HTML report.",
        "",
    ]
    for i, ss in enumerate(screenshots):
        if not ss.get("error"):
            lines.append(f"  [{i+1}] {ss.get('viewport', 'unknown')} viewport")
            lines.append(f"      Size: {ss.get('width', '?')}x{ss.get('height', '?')} px")
    return "\n".join(lines)


@router.post("/zip")
async def export_zip(request: ExportRequest):
    """
    Export everything as a single ZIP file.
    The ZIP is named after the website (e.g., stripe_com_report.zip).
    Contents:
    - analysis.json (raw data)
    - report.md (readable Markdown report)
    - pages_and_subdomains.txt (all pages + subdomains)
    - ai_report.txt (AI analysis)
    - data.csv (spreadsheet format)
    - screenshots_info.txt (info about screenshots)
    - README.txt
    """
    site_name = _get_site_name(request.url)
    data = request.data

    ai_data = data.get("ai_analysis", {}) or {}
    screenshots = data.get("screenshots", [])

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Main analysis JSON
        zf.writestr(
            f"{site_name}/analysis.json",
            json.dumps(data, indent=2, ensure_ascii=False)
        )

        # Readable markdown report
        zf.writestr(
            f"{site_name}/report.md",
            _to_markdown(data, request.url)
        )

        # Pages and subdomains
        zf.writestr(
            f"{site_name}/pages_and_subdomains.txt",
            _to_subdomains_txt(data, request.url)
        )

        # AI report (only if AI analysis data exists)
        if ai_data:
            zf.writestr(
                f"{site_name}/ai_report.txt",
                _to_ai_report_txt(ai_data, request.url)
            )
        else:
            zf.writestr(
                f"{site_name}/ai_report.txt",
                "AI analysis was not run or is not available.\nGo to the AI Analysis tab in DeepWeb and click 'Run AI Analysis' first."
            )

        # CSV data
        zf.writestr(
            f"{site_name}/data.csv",
            _to_csv(data)
        )

        # Screenshots info
        if screenshots:
            zf.writestr(
                f"{site_name}/screenshots/info.txt",
                _to_screenshots_readme(screenshots)
            )
            # Save each screenshot as a separate file if it has data
            for i, ss in enumerate(screenshots):
                if ss.get("data_url") and not ss.get("error"):
                    viewport = ss.get("viewport", f"viewport_{i}")
                    # data_url format: data:image/png;base64,XXXX
                    data_url = ss.get("data_url", "")
                    if "base64," in data_url:
                        import base64
                        try:
                            b64_data = data_url.split("base64,")[1]
                            img_bytes = base64.b64decode(b64_data)
                            zf.writestr(
                                f"{site_name}/screenshots/{viewport}.png",
                                img_bytes
                            )
                        except Exception as e:
                            logger.warning(f"Could not save screenshot {viewport}: {e}")

        # README
        zf.writestr(
            f"{site_name}/README.txt",
            f"""DeepWeb Analysis Report
{'=' * 40}
Website: {request.url}
Exported: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Job ID: {request.job_id}

FILES IN THIS ZIP:
  analysis.json          - Complete raw data (all findings)
  report.md              - Human-readable Markdown report
  pages_and_subdomains.txt - All discovered pages & subdomains
  ai_report.txt          - AI-powered insights and suggestions
  data.csv               - Spreadsheet-friendly export
  screenshots/           - Website screenshots (desktop, tablet, mobile)

Generated by DeepWeb — Scan any website in seconds
"""
        )

    buffer.seek(0)
    zip_filename = f"{site_name}_deepweb_report.zip"

    return StreamingResponse(
        io.BytesIO(buffer.read()),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zip_filename}"'},
    )
