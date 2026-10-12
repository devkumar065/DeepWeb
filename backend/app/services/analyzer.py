"""
Analyzer Service — Detects CMS, framework, tech stack, brand assets.
"""
import re
import logging
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import httpx
import colorsys

logger = logging.getLogger(__name__)


class AnalyzerService:

    # ─── Technology Fingerprints ──────────────────────────────────────────
    CMS_SIGNATURES: Dict[str, List[Dict]] = {
        "WordPress": [
            {"html": r"wp-content|wp-includes"},
            {"html": r"/wp-json/"},
            {"header": {"x-powered-by": "WordPress"}},
        ],
        "Shopify": [
            {"html": r"cdn\.shopify\.com|Shopify\.theme"},
            {"header": {"x-shopify-stage": ".*"}},
        ],
        "Webflow": [
            {"html": r"webflow\.com|data-wf-"},
            {"header": {"x-powered-by": "Webflow"}},
        ],
        "Wix": [
            {"html": r"static\.wixstatic\.com|wix-code"},
        ],
        "Squarespace": [
            {"html": r"static1\.squarespace\.com|squarespace-cdn"},
        ],
        "Ghost": [
            {"html": r"ghost-url|content\.ghost\.io"},
            {"header": {"x-ghost-cache-status": ".*"}},
        ],
        "Framer": [
            {"html": r"framer\.com|framerusercontent"},
        ],
        "HubSpot CMS": [
            {"html": r"hubspot\.com|hs-scripts"},
        ],
    }

    FRAMEWORK_SIGNATURES: Dict[str, List[Dict]] = {
        "Next.js": [
            {"html": r"__next|_next/static|__NEXT_DATA__"},
            {"header": {"x-powered-by": "Next.js"}},
        ],
        "React": [
            {"html": r"react-dom|__react|data-reactroot"},
        ],
        "Vue.js": [
            {"html": r"__vue__|vue-router|data-v-"},
        ],
        "Nuxt.js": [
            {"html": r"__nuxt|_nuxt/"},
        ],
        "Angular": [
            {"html": r"ng-version|angular\.js|ng-app"},
        ],
        "Svelte": [
            {"html": r"svelte|__svelte"},
        ],
        "Remix": [
            {"html": r"__remixContext|remix-utils"},
        ],
        "Gatsby": [
            {"html": r"gatsby-image|___gatsby|gatsby-plugin"},
        ],
        "Astro": [
            {"html": r"astro-island|data-astro"},
        ],
        "Laravel": [
            {"html": r"laravel|csrf-token.*laravel"},
            {"header": {"x-powered-by": "PHP"}},
        ],
    }

    CDN_SIGNATURES: Dict[str, List] = {
        "Cloudflare": ["cf-ray", "cf-cache-status", "cloudflare"],
        "Fastly": ["x-fastly-request-id", "fastly"],
        "Akamai": ["x-akamai-transformed", "akamaized"],
        "AWS CloudFront": ["x-amz-cf-id", "x-amz-cf-pop"],
        "Vercel Edge": ["x-vercel-cache", "x-vercel-id"],
        "Google CDN": ["x-google-backends"],
        "BunnyCDN": ["bunnycdn"],
        "KeyCDN": ["x-cache.*keycdn"],
    }

    ANALYTICS_SIGNATURES: Dict[str, str] = {
        "Google Analytics 4": r"gtag\(|GA_MEASUREMENT_ID|googletagmanager\.com",
        "Google Tag Manager": r"googletagmanager\.com/gtm\.js",
        "Mixpanel": r"mixpanel\.init|api\.mixpanel\.com",
        "Hotjar": r"hotjar\.com|hjSetting|_hjid",
        "Segment": r"analytics\.load|cdn\.segment\.com",
        "Amplitude": r"amplitude\.getInstance|cdn\.amplitude\.com",
        "PostHog": r"posthog\.init|app\.posthog\.com",
        "Microsoft Clarity": r"clarity\(|clarity\.ms",
        "Plausible": r"plausible\.io",
        "Umami": r"umami\.is",
        "Intercom": r"intercomSettings|widget\.intercom\.io",
        "Crisp": r"crisp\.chat|window\.CRISP_WEBSITE_ID",
        "HubSpot Analytics": r"js\.hs-scripts\.com|hbspt",
        "Facebook Pixel": r"fbevents\.js|facebook\.com/tr",
    }

    HOSTING_SIGNATURES: Dict[str, List] = {
        "Vercel": ["x-vercel-id", "x-vercel-cache"],
        "Netlify": ["x-nf-request-id", "netlify"],
        "AWS": ["x-amzn-requestid", "x-amz-"],
        "Google Cloud": ["x-google-backends", "x-goog-"],
        "Azure": ["x-azure-ref", "azure"],
        "Heroku": ["x-request-id", "via: 1.1 vegur"],
        "DigitalOcean": ["do-droplet"],
        "Render": ["x-render-origin-server"],
        "Railway": ["x-railway-"],
        "Fly.io": ["fly-request-id"],
    }

    CSS_FRAMEWORKS: Dict[str, str] = {
        "Tailwind CSS": r"tailwind|tw-|sm:|md:|lg:|xl:",
        "Bootstrap": r"bootstrap|btn-primary|navbar-|col-md-",
        "Material UI": r"MuiButton|MuiTypography|makeStyles",
        "Chakra UI": r"chakra-|css-chakra",
        "Ant Design": r"ant-|antd",
        "Styled Components": r"sc-|css-\w{8}",
        "Emotion": r"css-[\w]{8}",
        "Mantine": r"mantine-",
        "Radix UI": r"radix-|data-radix",
    }

    PAYMENT_SIGNATURES: Dict[str, str] = {
        "Stripe": r"stripe\.com|js\.stripe\.com",
        "PayPal": r"paypal\.com|paypalobjects",
        "Square": r"square\.com|squareup",
        "Paddle": r"paddle\.com",
        "Lemonsqueezy": r"lemonsqueezy\.com",
    }

    # ─── Public Methods ───────────────────────────────────────────────────

    def detect_technologies(
        self,
        html: str,
        headers: Dict[str, str],
        page_url: str = "",
    ) -> List[Dict[str, Any]]:
        techs = []
        lower_html = html.lower()
        lower_headers = {k.lower(): v.lower() for k, v in headers.items()}

        # CMS
        for name, sigs in self.CMS_SIGNATURES.items():
            confidence = self._match_signatures(html, lower_headers, sigs)
            if confidence > 0:
                techs.append({"name": name, "category": "cms", "confidence": confidence})

        # Frameworks
        for name, sigs in self.FRAMEWORK_SIGNATURES.items():
            confidence = self._match_signatures(html, lower_headers, sigs)
            if confidence > 0:
                techs.append({"name": name, "category": "framework", "confidence": confidence})

        # Analytics
        for name, pattern in self.ANALYTICS_SIGNATURES.items():
            if re.search(pattern, html, re.IGNORECASE):
                techs.append({"name": name, "category": "analytics", "confidence": 90})

        # CSS Frameworks
        for name, pattern in self.CSS_FRAMEWORKS.items():
            if re.search(pattern, html, re.IGNORECASE):
                techs.append({"name": name, "category": "css_framework", "confidence": 85})

        # CDN
        for name, keys in self.CDN_SIGNATURES.items():
            for key in keys:
                matched = any(key in k or key in v for k, v in lower_headers.items())
                if matched:
                    techs.append({"name": name, "category": "cdn", "confidence": 95})
                    break

        # Hosting
        for name, keys in self.HOSTING_SIGNATURES.items():
            for key in keys:
                matched = any(key in k or key in v for k, v in lower_headers.items())
                if matched:
                    techs.append({"name": name, "category": "hosting", "confidence": 90})
                    break

        # Payments
        for name, pattern in self.PAYMENT_SIGNATURES.items():
            if re.search(pattern, html, re.IGNORECASE):
                techs.append({"name": name, "category": "payment", "confidence": 90})

        # Deduplicate by name
        seen = set()
        unique = []
        for t in sorted(techs, key=lambda x: -x["confidence"]):
            if t["name"] not in seen:
                seen.add(t["name"])
                unique.append(t)
        return unique

    def detect_cms(self, html: str, headers: Dict[str, str]) -> Optional[str]:
        lower_headers = {k.lower(): v.lower() for k, v in headers.items()}
        for name, sigs in self.CMS_SIGNATURES.items():
            if self._match_signatures(html, lower_headers, sigs) > 0:
                return name
        return None

    def detect_framework(self, html: str, headers: Dict[str, str]) -> Optional[str]:
        lower_headers = {k.lower(): v.lower() for k, v in headers.items()}
        for name, sigs in self.FRAMEWORK_SIGNATURES.items():
            if self._match_signatures(html, lower_headers, sigs) > 0:
                return name
        return None

    def detect_cdn(self, headers: Dict[str, str]) -> Optional[str]:
        lower_headers = {k.lower(): v.lower() for k, v in headers.items()}
        for name, keys in self.CDN_SIGNATURES.items():
            for key in keys:
                if any(key in k or key in v for k, v in lower_headers.items()):
                    return name
        return None

    def detect_analytics(self, html: str) -> List[str]:
        found = []
        for name, pattern in self.ANALYTICS_SIGNATURES.items():
            if re.search(pattern, html, re.IGNORECASE):
                found.append(name)
        return found

    def detect_hosting(self, headers: Dict[str, str]) -> Optional[str]:
        lower_headers = {k.lower(): v.lower() for k, v in headers.items()}
        for name, keys in self.HOSTING_SIGNATURES.items():
            for key in keys:
                if any(key in k or key in v for k, v in lower_headers.items()):
                    return name
        return None

    def extract_colors(self, html: str, css_texts: List[str] = []) -> List[Dict]:
        """Extract brand colors from HTML and CSS"""
        colors = {}
        hex_pattern = re.compile(r'#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b')
        rgb_pattern = re.compile(r'rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)')

        all_text = html + " ".join(css_texts)

        for match in hex_pattern.finditer(all_text):
            hex_val = match.group(0)
            normalized = self._normalize_hex(hex_val)
            if normalized and self._is_brand_color(normalized):
                colors[normalized] = colors.get(normalized, 0) + 1

        for match in rgb_pattern.finditer(all_text):
            r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
            hex_val = f"#{r:02x}{g:02x}{b:02x}"
            if self._is_brand_color(hex_val):
                colors[hex_val] = colors.get(hex_val, 0) + 1

        # Sort by frequency and return top colors
        sorted_colors = sorted(colors.items(), key=lambda x: -x[1])[:15]
        result = []
        for hex_val, count in sorted_colors:
            rgb = self._hex_to_rgb(hex_val)
            hsl = self._rgb_to_hsl(*rgb)
            result.append({
                "hex": hex_val.upper(),
                "rgb": f"rgb({rgb[0]}, {rgb[1]}, {rgb[2]})",
                "hsl": f"hsl({hsl[0]}, {hsl[1]}%, {hsl[2]}%)",
                "frequency": count,
            })
        return result

    def extract_fonts(self, html: str, css_texts: List[str] = []) -> List[Dict]:
        fonts = {}
        all_text = html + " ".join(css_texts)

        # Google Fonts detection
        gf_pattern = re.compile(r'fonts\.googleapis\.com/css.*?family=([^&"\']+)', re.IGNORECASE)
        for match in gf_pattern.finditer(all_text):
            family_str = match.group(1)
            for family in family_str.split("|"):
                name = family.split(":")[0].replace("+", " ").strip()
                weights_match = re.findall(r':(\d+)', family)
                if name:
                    fonts[name] = {
                        "family": name,
                        "source": "google",
                        "weights": weights_match or ["400", "700"],
                    }

        # CSS font-family declarations
        ff_pattern = re.compile(r'font-family:\s*([^;{]+)', re.IGNORECASE)
        for match in ff_pattern.finditer(all_text):
            families = match.group(1).split(",")
            for f in families:
                name = re.sub(r'[\'"]', '', f).strip()
                if name and name not in ["sans-serif", "serif", "monospace", "inherit", "initial"]:
                    if name not in fonts:
                        fonts[name] = {"family": name, "source": "local", "weights": []}

        return list(fonts.values())[:10]

    def extract_navigation(self, html: str) -> Dict:
        soup = BeautifulSoup(html, "lxml")
        navbar = self._extract_nav_items(soup, ["nav", "header"])
        footer = self._extract_nav_items(soup, ["footer"])
        return {"navbar": navbar, "footer": footer, "breadcrumbs": []}

    def extract_seo_data(self, html: str, url: str) -> Dict:
        soup = BeautifulSoup(html, "lxml")

        def meta(name=None, property=None):
            if name:
                tag = soup.find("meta", attrs={"name": name})
            elif property:
                tag = soup.find("meta", attrs={"property": property})
            else:
                return None
            return tag.get("content") if tag else None

        # Structured data
        structured_data = []
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                import json
                data = json.loads(script.string or "")
                structured_data.append(data)
            except Exception:
                pass

        schema_types = [d.get("@type", "") for d in structured_data if isinstance(d, dict)]

        keywords_str = meta(name="keywords") or ""
        keywords = [k.strip() for k in keywords_str.split(",") if k.strip()]

        canonical_tag = soup.find("link", rel="canonical")
        robots_tag = soup.find("meta", attrs={"name": "robots"})

        # Hreflang
        hreflang = []
        for tag in soup.find_all("link", rel="alternate"):
            if tag.get("hreflang"):
                hreflang.append({"lang": tag.get("hreflang"), "url": tag.get("href", "")})

        return {
            "title": soup.title.string if soup.title else None,
            "meta_description": meta(name="description"),
            "canonical": canonical_tag.get("href") if canonical_tag else None,
            "robots": robots_tag.get("content") if robots_tag else None,
            "og_title": meta(property="og:title"),
            "og_description": meta(property="og:description"),
            "og_image": meta(property="og:image"),
            "og_type": meta(property="og:type"),
            "twitter_card": meta(name="twitter:card"),
            "twitter_title": meta(name="twitter:title"),
            "twitter_description": meta(name="twitter:description"),
            "twitter_image": meta(name="twitter:image"),
            "hreflang": hreflang,
            "keywords": keywords,
            "structured_data": structured_data,
            "schema_types": schema_types,
        }

    def extract_social_links(self, html: str) -> Dict:
        patterns = {
            "instagram": r'instagram\.com/([A-Za-z0-9_.]+)',
            "linkedin": r'linkedin\.com/(?:company|in)/([A-Za-z0-9_.-]+)',
            "twitter": r'(?:twitter|x)\.com/([A-Za-z0-9_]+)',
            "facebook": r'facebook\.com/([A-Za-z0-9_.]+)',
            "youtube": r'youtube\.com/(?:c/|channel/|@)?([A-Za-z0-9_-]+)',
            "github": r'github\.com/([A-Za-z0-9_-]+)',
            "discord": r'discord\.(?:com|gg)/([A-Za-z0-9_-]+)',
            "tiktok": r'tiktok\.com/@([A-Za-z0-9_.]+)',
        }
        results = {}
        for platform, pattern in patterns.items():
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                results[platform] = match.group(0) if "http" in match.group(0).lower() else f"https://{match.group(0)}"
        return results

    def extract_contacts(self, html: str) -> Dict:
        emails = list(set(re.findall(
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', html
        )))
        phones = list(set(re.findall(
            r'(?:\+?\d[\d\s\-().]{7,}\d)', html
        )))[:10]

        calendly = re.search(r'calendly\.com/([A-Za-z0-9_/-]+)', html)
        whatsapp = re.search(r'wa\.me/(\d+)|api\.whatsapp\.com/send\?phone=(\d+)', html)
        maps = re.search(r'maps\.google\.com[^\s"\'<>]*|goo\.gl/maps/[A-Za-z0-9]+', html)

        return {
            "emails": [e for e in emails if not any(x in e for x in ["example.com", "test.com"])],
            "phones": phones,
            "calendly_url": f"https://calendly.com/{calendly.group(1)}" if calendly else None,
            "whatsapp_url": f"https://wa.me/{whatsapp.group(1) or whatsapp.group(2)}" if whatsapp else None,
            "google_maps_url": maps.group(0) if maps else None,
        }

    async def get_domain_age(self, domain: str) -> Optional[str]:
        try:
            import whois
            import asyncio
            w = await asyncio.to_thread(whois.whois, domain)
            creation_date = w.creation_date
            if isinstance(creation_date, list):
                creation_date = creation_date[0]
            if creation_date:
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                if creation_date.tzinfo is None:
                    creation_date = creation_date.replace(tzinfo=timezone.utc)
                delta = now - creation_date
                years = delta.days // 365
                months = (delta.days % 365) // 30
                if years > 0:
                    return f"{years} year{'s' if years != 1 else ''}, {months} month{'s' if months != 1 else ''}"
                return f"{months} month{'s' if months != 1 else ''}"
        except Exception as e:
            logger.debug(f"WHOIS lookup failed: {e}")
        return None

    # ─── Private Helpers ──────────────────────────────────────────────────

    def _match_signatures(self, html: str, headers: Dict, sigs: List[Dict]) -> int:
        for sig in sigs:
            if "html" in sig and re.search(sig["html"], html, re.IGNORECASE):
                return 90
            if "header" in sig:
                for hkey, hval in sig["header"].items():
                    for k, v in headers.items():
                        if hkey.lower() == k and re.search(hval, v, re.IGNORECASE):
                            return 95
        return 0

    def _normalize_hex(self, hex_val: str) -> Optional[str]:
        hex_val = hex_val.lstrip("#")
        if len(hex_val) == 3:
            hex_val = "".join(c * 2 for c in hex_val)
        if len(hex_val) == 6:
            return f"#{hex_val.lower()}"
        return None

    def _is_brand_color(self, hex_val: str) -> bool:
        """Filter out pure white/black and very light colors"""
        rgb = self._hex_to_rgb(hex_val)
        if not rgb:
            return False
        r, g, b = rgb
        # Skip pure white
        if r > 245 and g > 245 and b > 245:
            return False
        # Skip pure black
        if r < 10 and g < 10 and b < 10:
            return False
        return True

    def _hex_to_rgb(self, hex_val: str) -> Optional[Tuple[int, int, int]]:
        hex_val = hex_val.lstrip("#")
        if len(hex_val) == 6:
            return tuple(int(hex_val[i:i+2], 16) for i in (0, 2, 4))
        return None

    def _rgb_to_hsl(self, r: int, g: int, b: int) -> Tuple[int, int, int]:
        r, g, b = r / 255, g / 255, b / 255
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        return (round(h * 360), round(s * 100), round(l * 100))

    def _extract_nav_items(self, soup: BeautifulSoup, tags: List[str]) -> List[Dict]:
        items = []
        for tag in tags:
            elements = soup.find_all(tag)
            for el in elements:
                for a in el.find_all("a", href=True):
                    label = a.get_text(strip=True)
                    href = a.get("href", "")
                    if label and len(label) < 60:
                        items.append({"label": label, "url": href, "children": []})
        return items[:50]


analyzer_service = AnalyzerService()
