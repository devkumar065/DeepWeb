"""
Export Endpoints — Export analysis data in multiple formats
"""
import csv
import io
import json
import logging
import zipfile
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class ExportRequest(BaseModel):
    job_id: str
    url: str
    data: Dict[str, Any]
    format: str = "json"  # json, csv, markdown, html, zip
    include_assets: bool = False


def _to_markdown(data: Dict[str, Any], url: str) -> str:
    lines = [
        f"# Website Intelligence Report",
        f"",
        f"**URL:** {url}",
        f"**Generated:** {__import__('datetime').datetime.now().isoformat()}",
        f"",
        f"---",
        f"",
    ]

    overview = data.get("overview", {})
    if overview:
        lines += [
            "## 🌐 Website Overview",
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
            "## 🔍 SEO Analysis",
            f"- **Meta Description:** {seo.get('meta_description', 'N/A')}",
            f"- **Canonical:** {seo.get('canonical', 'N/A')}",
            f"- **OG Title:** {seo.get('og_title', 'N/A')}",
            f"- **Twitter Card:** {seo.get('twitter_card', 'N/A')}",
            f"- **Schema Types:** {', '.join(seo.get('schema_types', []))}",
            f"",
        ]

    technologies = data.get("technologies", [])
    if technologies:
        lines.append("## ⚙️ Technologies Detected")
        for tech in technologies:
            lines.append(f"- **{tech.get('name')}** ({tech.get('category')}) — {tech.get('confidence')}% confidence")
        lines.append("")

    social = data.get("social_media", {})
    if social:
        lines.append("## 📱 Social Media")
        for platform, link in social.items():
            if link:
                lines.append(f"- **{platform.title()}:** {link}")
        lines.append("")

    contacts = data.get("contacts", {})
    if contacts:
        lines.append("## 📞 Contact Information")
        for email in contacts.get("emails", []):
            lines.append(f"- **Email:** {email}")
        for phone in contacts.get("phones", []):
            lines.append(f"- **Phone:** {phone}")
        if contacts.get("address"):
            lines.append(f"- **Address:** {contacts['address']}")
        lines.append("")

    pages = data.get("pages", [])
    if pages:
        lines.append("## 📄 Discovered Pages")
        for page in pages:
            lines.append(f"- [{page.get('url')}]({page.get('url')}) — {page.get('type', 'custom')}")
        lines.append("")

    return "\n".join(lines)


def _to_html(data: Dict[str, Any], url: str) -> str:
    overview = data.get("overview", {})
    technologies = data.get("technologies", [])
    pages = data.get("pages", [])

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Website Intelligence Report — {url}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; line-height: 1.6; }}
  .container {{ max-width: 1200px; margin: 0 auto; padding: 40px 20px; }}
  h1 {{ font-size: 2rem; font-weight: 700; margin-bottom: 8px; }}
  h2 {{ font-size: 1.25rem; font-weight: 600; margin: 32px 0 16px; border-bottom: 2px solid #000; padding-bottom: 8px; }}
  .meta {{ color: #666; margin-bottom: 32px; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }}
  .card {{ border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px; }}
  .card .label {{ font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }}
  .card .value {{ font-size: 1rem; font-weight: 600; margin-top: 4px; }}
  .badge {{ display: inline-block; padding: 2px 8px; background: #000; color: #fff; border-radius: 4px; font-size: 0.75rem; margin: 2px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
  th, td {{ text-align: left; padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }}
  th {{ font-weight: 600; background: #f5f5f5; }}
  a {{ color: #000; }}
</style>
</head>
<body>
<div class="container">
  <h1>Website Intelligence Report</h1>
  <p class="meta">URL: <a href="{url}">{url}</a> · Generated: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
  
  <h2>Overview</h2>
  <div class="grid">
    <div class="card"><div class="label">Title</div><div class="value">{overview.get('title', 'N/A')}</div></div>
    <div class="card"><div class="label">Framework</div><div class="value">{overview.get('framework', 'N/A')}</div></div>
    <div class="card"><div class="label">CMS</div><div class="value">{overview.get('cms', 'N/A')}</div></div>
    <div class="card"><div class="label">CDN</div><div class="value">{overview.get('cdn', 'N/A')}</div></div>
    <div class="card"><div class="label">Hosting</div><div class="value">{overview.get('hosting', 'N/A')}</div></div>
    <div class="card"><div class="label">Domain Age</div><div class="value">{overview.get('domain_age', 'N/A')}</div></div>
  </div>
  
  <h2>Technologies</h2>
  <div>
    {''.join(f'<span class="badge">{t.get("name")} ({t.get("confidence")}%)</span>' for t in technologies)}
  </div>
  
  <h2>Pages ({len(pages)})</h2>
  <table>
    <thead><tr><th>URL</th><th>Title</th><th>Type</th></tr></thead>
    <tbody>
      {''.join(f'<tr><td><a href="{p.get("url")}">{p.get("url")}</a></td><td>{p.get("title", "")}</td><td>{p.get("type", "custom")}</td></tr>' for p in pages)}
    </tbody>
  </table>
</div>
</body>
</html>"""
    return html


def _to_csv(data: Dict[str, Any]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    # Overview section
    writer.writerow(["Section", "Key", "Value"])
    overview = data.get("overview", {})
    for k, v in overview.items():
        writer.writerow(["Overview", k, str(v)])

    writer.writerow([])

    # Technologies
    writer.writerow(["Technologies", "Name", "Category", "Confidence"])
    for tech in data.get("technologies", []):
        writer.writerow(["Technology", tech.get("name"), tech.get("category"), tech.get("confidence")])

    writer.writerow([])

    # Pages
    writer.writerow(["Pages", "URL", "Title", "Type", "Depth"])
    for page in data.get("pages", []):
        writer.writerow(["Page", page.get("url"), page.get("title"), page.get("type"), page.get("depth")])

    writer.writerow([])

    # Social Media
    writer.writerow(["Social", "Platform", "URL"])
    for platform, link in data.get("social_media", {}).items():
        if link:
            writer.writerow(["Social", platform, link])

    return output.getvalue()


def _to_txt(data: Dict[str, Any], url: str) -> str:
    lines = []
    lines.append(f"Website Intelligence Report — All Links & Details")
    lines.append(f"URL: {url}")
    lines.append(f"Generated: {__import__('datetime').datetime.now().isoformat()}")
    lines.append("-" * 50)
    lines.append("")

    pages = data.get("pages", [])
    if pages:
        lines.append("--- PAGE LINKS ---")
        for p in pages:
            lines.append(f"{p.get('url')} (Title: {p.get('title', '')}) - {p.get('type', 'custom')}")
        lines.append("")
        
    assets = data.get("assets", [])
    if assets:
        lines.append("--- ASSET LINKS (Images, Videos, SVGs, etc.) ---")
        for a in assets:
            if a.get('url') != 'inline':
                lines.append(f"{a.get('url')} (Type: {a.get('type')}, Format: {a.get('format')}, Category: {a.get('category')})")
        lines.append("")

    social = data.get("social_media", {})
    if social:
        lines.append("--- SOCIAL MEDIA LINKS ---")
        for platform, link in social.items():
            if link:
                lines.append(f"{link} (Platform: {platform})")
        lines.append("")
        
    contacts = data.get("contacts", {})
    if contacts:
        lines.append("--- CONTACT DETAILS ---")
        for email in contacts.get("emails", []):
            lines.append(f"Email: {email}")
        for phone in contacts.get("phones", []):
            lines.append(f"Phone: {phone}")
        lines.append("")
        
    return "\n".join(lines)


@router.post("/json")
async def export_json(request: ExportRequest):
    """Export full analysis as JSON"""
    content = json.dumps(request.data, indent=2, ensure_ascii=False)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="webintel_{request.job_id}.json"'},
    )


@router.post("/csv")
async def export_csv(request: ExportRequest):
    """Export analysis as CSV"""
    content = _to_csv(request.data)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="webintel_{request.job_id}.csv"'},
    )


@router.post("/txt")
async def export_txt(request: ExportRequest):
    """Export analysis as TXT with all links line by line"""
    content = _to_txt(request.data, request.url)
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="webintel_{request.job_id}.txt"'},
    )


@router.post("/markdown")
async def export_markdown(request: ExportRequest):
    """Export analysis as Markdown"""
    content = _to_markdown(request.data, request.url)
    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="webintel_{request.job_id}.md"'},
    )


@router.post("/html")
async def export_html(request: ExportRequest):
    """Export analysis as HTML report"""
    content = _to_html(request.data, request.url)
    return Response(
        content=content,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="webintel_{request.job_id}.html"'},
    )


@router.post("/zip")
async def export_zip(request: ExportRequest):
    """Export everything as a ZIP archive"""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("analysis.json", json.dumps(request.data, indent=2))
        zf.writestr("report.md", _to_markdown(request.data, request.url))
        zf.writestr("report.html", _to_html(request.data, request.url))
        zf.writestr("data.csv", _to_csv(request.data))
        zf.writestr("all_links_and_details.txt", _to_txt(request.data, request.url))
        zf.writestr("README.txt", f"Website Intelligence Report\nURL: {request.url}\nJob ID: {request.job_id}\n")

    buffer.seek(0)
    return StreamingResponse(
        io.BytesIO(buffer.read()),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="webintel_{request.job_id}.zip"'},
    )
