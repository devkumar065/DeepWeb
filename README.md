# WebIntel — Website Intelligence Platform

> Production-grade Website Intelligence and Reverse Engineering Platform

![Tech Stack](https://img.shields.io/badge/Next.js-15-black?style=flat-square) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-black?style=flat-square) ![Playwright](https://img.shields.io/badge/Playwright-latest-black?style=flat-square)

## Features

| Step | Feature | Description |
|------|---------|-------------|
| 1 | URL Input | Enter any website URL |
| 2 | Page Discovery | sitemap.xml → robots.txt → internal links → dynamic routes |
| 3 | Website Overview | Title, meta, domain age, favicon, language, CMS, framework, hosting, CDN, analytics |
| 4 | Brand Analysis | Logo, colors (RGB/HEX/HSL), fonts, spacing, border radius |
| 5 | Visual Asset Extraction | Images, SVGs, videos, Lottie animations, icons |
| 6 | Screenshot Engine | Desktop, tablet, mobile, full-page screenshots |
| 7 | Content Extraction | Hero, headings, services, pricing, FAQs, team, footer |
| 8 | Navigation Analysis | Navbar, dropdowns, mega menus, footer links, tree view |
| 9 | SEO Analysis | Meta tags, OG, Twitter cards, schema, canonical, hreflang |
| 10 | Technology Detection | 50+ technologies detected with confidence scores |
| 11 | Social Media Discovery | Instagram, LinkedIn, X, YouTube, GitHub, Discord, etc. |
| 12 | Contact Discovery | Emails, phones, address, Calendly, WhatsApp |
| 13 | AI Analysis | Gemini-powered business insights, suggestions |
| 14 | AI Redesign | Apple/Stripe/Linear-style component generation |
| 15 | Exports | JSON, CSV, Markdown, HTML, ZIP |

## Tech Stack

**Frontend:** Next.js 15 · TypeScript · TailwindCSS · Shadcn UI · Framer Motion · Zustand

**Backend:** FastAPI · Python · Playwright · BeautifulSoup · WHOIS

**Crawling:** Firecrawl API (primary) · Playwright (fallback)

**AI:** Gemini 1.5 Pro (primary) · OpenAI GPT-4o (fallback)

**Storage:** Supabase · Redis (queue)

## Setup

### 1. Clone and Install

```bash
git clone <repo>
cd "Web Details"
```

### 2. Configure API Keys

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your API keys
```

### 3. Start Everything

```bash
chmod +x start.sh
./start.sh
```

**Or manually:**

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 4. Open the App

- **App:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/docs

## API Keys Required

| Service | Required | Purpose |
|---------|----------|---------|
| `GEMINI_API_KEY` | Optional | AI analysis (primary) |
| `OPENAI_API_KEY` | Optional | AI analysis (fallback) |
| `FIRECRAWL_API_KEY` | Optional | Fast crawling (fallback: Playwright) |
| `SUPABASE_URL` + keys | Optional | Screenshot/asset storage |
| `REDIS_URL` | Optional | Job queue |

> The platform works without any API keys using Playwright as the crawler and skipping AI features.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Next.js)                  │
│  HeroInput → AnalysisDashboard → 11 Analysis Tabs    │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼────────────────────────────┐
│                FastAPI Backend                        │
│  /crawl  /analysis  /screenshots  /assets  /ai  /export │
└─┬──────────────────────────────────────────────────┘
  │
  ├── Playwright (browser automation)
  ├── Firecrawl API (fast crawling)
  ├── BeautifulSoup (HTML parsing)
  ├── Gemini / OpenAI (AI analysis)
  └── Supabase (storage)
```

## Project Structure

```
Web Details/
├── frontend/                    # Next.js 15 app
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx         # Main page + analysis orchestration
│       │   └── globals.css      # Design system
│       ├── components/
│       │   ├── HeroInput.tsx    # URL input
│       │   ├── AnalysisDashboard.tsx
│       │   ├── CrawlProgress.tsx
│       │   └── tabs/            # 11 analysis tabs
│       ├── store/analysis.ts    # Zustand state
│       └── lib/api.ts           # Axios API client
│
└── backend/                     # FastAPI app
    ├── main.py
    └── app/
        ├── api/v1/endpoints/    # crawl, analysis, screenshots, assets, ai, export
        ├── services/            # crawler, analyzer, content extractor
        └── models/schemas.py    # Pydantic models
```
