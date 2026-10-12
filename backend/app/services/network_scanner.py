import asyncio
import socket
import ssl
import logging
from datetime import datetime
from urllib.parse import urlparse
import httpx
import tldextract
import whois
import dns.resolver
import dns.reversename
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

async def scan_network_security(url: str) -> Dict[str, Any]:
    """Perform comprehensive network and security scan for a URL."""
    parsed_url = urlparse(url)
    if not parsed_url.scheme:
        url = f"https://{url}"
        parsed_url = urlparse(url)
    
    hostname = parsed_url.hostname or url
    extracted = tldextract.extract(hostname)
    domain = f"{extracted.domain}.{extracted.suffix}" if extracted.suffix else extracted.domain

    results = {
        "url": url,
        "domain": domain,
        "hostname": hostname,
        "dns": {},
        "whois": {},
        "ssl": {},
        "headers": {},
        "email_security": {},
        "performance": {},
        "accessibility": {}
    }

    # Run everything concurrently if possible, except those that depend on others
    await asyncio.gather(
        _scan_dns(hostname, results["dns"]),
        _scan_whois(domain, results["whois"]),
        _scan_ssl(hostname, results["ssl"]),
        _scan_headers_and_performance(url, results),
        _scan_email_security(domain, results["email_security"])
    )

    return results


async def _scan_dns(hostname: str, dns_results: Dict[str, Any]) -> None:
    try:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = 5.0
        resolver.timeout = 5.0

        records = {"A": [], "AAAA": [], "MX": [], "TXT": [], "NS": [], "CNAME": [], "SOA": []}

        # Resolve records
        for record_type in records.keys():
            try:
                answers = resolver.resolve(hostname, record_type)
                records[record_type] = [str(rdata) for rdata in answers]
            except Exception:
                pass
        
        dns_results["records"] = records

        # IP Geolocation and PTR
        ips = records.get("A", [])
        if ips:
            primary_ip = ips[0]
            dns_results["primary_ip"] = primary_ip
            try:
                rev_name = dns.reversename.from_address(primary_ip)
                ptr = resolver.resolve(rev_name, "PTR")
                dns_results["ptr"] = [str(r) for r in ptr]
            except Exception:
                dns_results["ptr"] = []

            # Geo and ASN
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(f"http://ip-api.com/json/{primary_ip}?fields=status,message,country,city,isp,org,as,query")
                    if resp.status_code == 200:
                        dns_results["geolocation"] = resp.json()
            except Exception as e:
                logger.error(f"Error fetching IP geo: {e}")
                dns_results["geolocation"] = None

        # DNSSEC
        try:
            dnssec_answers = resolver.resolve(hostname, "DNSKEY")
            dns_results["dnssec"] = bool(dnssec_answers)
        except Exception:
            dns_results["dnssec"] = False

    except Exception as e:
        logger.error(f"DNS scan error: {e}")
        dns_results["error"] = str(e)


async def _scan_whois(domain: str, whois_results: Dict[str, Any]) -> None:
    try:
        # whois library is blocking, run in executor
        loop = asyncio.get_running_loop()
        w = await loop.run_in_executor(None, whois.whois, domain)
        
        creation_date = w.creation_date
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
            
        expiration_date = w.expiration_date
        if isinstance(expiration_date, list):
            expiration_date = expiration_date[0]

        whois_results["registrar"] = w.registrar
        whois_results["creation_date"] = creation_date.isoformat() if isinstance(creation_date, datetime) else str(creation_date)
        whois_results["expiration_date"] = expiration_date.isoformat() if isinstance(expiration_date, datetime) else str(expiration_date)
        whois_results["name_servers"] = w.name_servers
        whois_results["status"] = w.status
        
        if isinstance(creation_date, datetime):
            whois_results["domain_age_days"] = (datetime.now() - creation_date).days
        else:
            whois_results["domain_age_days"] = None

    except Exception as e:
        logger.error(f"WHOIS scan error: {e}")
        whois_results["error"] = str(e)


async def _scan_ssl(hostname: str, ssl_results: Dict[str, Any]) -> None:
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        loop = asyncio.get_running_loop()

        def _get_cert():
            with socket.create_connection((hostname, 443), timeout=10.0) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert(binary_form=True)
                    cert_dict = ssock.getpeercert()
                    cipher = ssock.cipher()
                    version = ssock.version()
                    return cert_dict, cipher, version

        cert_dict, cipher, version = await loop.run_in_executor(None, _get_cert)

        if not cert_dict:
            # Fallback to ssl default connection for cert dict if binary fetching failed for dict
            def _get_dict_cert():
                context_v = ssl.create_default_context()
                with socket.create_connection((hostname, 443), timeout=10.0) as sock:
                    with context_v.wrap_socket(sock, server_hostname=hostname) as ssock:
                        return ssock.getpeercert()
            cert_dict = await loop.run_in_executor(None, _get_dict_cert)

        ssl_results["tls_version"] = version
        ssl_results["cipher"] = cipher
        
        if cert_dict:
            ssl_results["issuer"] = dict(x[0] for x in cert_dict.get('issuer', []))
            ssl_results["subject"] = dict(x[0] for x in cert_dict.get('subject', []))
            ssl_results["serialNumber"] = cert_dict.get('serialNumber')
            ssl_results["notBefore"] = cert_dict.get('notBefore')
            ssl_results["notAfter"] = cert_dict.get('notAfter')
            ssl_results["san"] = cert_dict.get('subjectAltName', [])
            
            # Days remaining
            try:
                not_after_date = datetime.strptime(cert_dict['notAfter'], '%b %d %H:%M:%S %Y %Z')
                ssl_results["days_remaining"] = (not_after_date - datetime.utcnow()).days
            except Exception:
                ssl_results["days_remaining"] = None

    except Exception as e:
        logger.error(f"SSL scan error: {e}")
        ssl_results["error"] = str(e)


async def _scan_headers_and_performance(url: str, results: Dict[str, Any]) -> None:
    try:
        headers_results = results["headers"]
        perf_results = results["performance"]
        acc_results = results["accessibility"]
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            # Timing
            start_time = datetime.now()
            response = await client.get(url)
            ttfb = (datetime.now() - start_time).total_seconds()
            
            perf_results["ttfb_seconds"] = ttfb
            perf_results["total_time_seconds"] = response.elapsed.total_seconds() if hasattr(response, 'elapsed') else ttfb
            
            # Size
            content = response.content
            perf_results["page_size_bytes"] = len(content)

            # Redirect chain
            chain = []
            for r in response.history:
                chain.append({"url": str(r.url), "status": r.status_code})
            chain.append({"url": str(response.url), "status": response.status_code})
            headers_results["redirect_chain"] = chain

            # Headers
            resp_headers = response.headers
            security_headers = {
                "Content-Security-Policy": None,
                "X-Frame-Options": None,
                "X-Content-Type-Options": None,
                "Referrer-Policy": None,
                "Permissions-Policy": None,
                "Strict-Transport-Security": None
            }
            for header in security_headers.keys():
                val = resp_headers.get(header)
                security_headers[header] = {"present": bool(val), "value": val}
            
            headers_results["security_headers"] = security_headers
            
            # Cookies
            cookies = []
            for name, cookie in response.cookies.items():
                cookies.append({
                    "name": name,
                    # We can't get flags easily from httpx response.cookies as they are Morsel, but httpx uses its own CookieJar
                    "value": cookie
                })
            headers_results["cookies"] = cookies
            
            # Detect CDN / WAF
            headers_results["cdn"] = _detect_cdn(resp_headers)
            headers_results["compression"] = resp_headers.get("Content-Encoding", "none")
            headers_results["http_version"] = response.http_version

            # Parsing HTML for Perf & A11y
            try:
                soup = BeautifulSoup(content, 'html.parser')
                
                # Perf resources
                perf_results["resource_counts"] = {
                    "images": len(soup.find_all('img')),
                    "scripts": len(soup.find_all('script')),
                    "stylesheets": len(soup.find_all('link', rel='stylesheet'))
                }

                # A11y
                imgs = soup.find_all('img')
                imgs_without_alt = [img for img in imgs if not img.get('alt')]
                acc_results["images_missing_alt_percentage"] = (len(imgs_without_alt) / len(imgs) * 100) if imgs else 0
                
                html_tag = soup.find('html')
                acc_results["has_lang_attribute"] = bool(html_tag and html_tag.get('lang'))

                roles = soup.find_all(attrs={"role": True})
                landmarks = [r.get('role') for r in roles if r.get('role') in ["banner", "navigation", "main", "contentinfo", "search", "complementary", "form"]]
                acc_results["aria_landmarks"] = len(landmarks)

            except Exception as e:
                logger.error(f"HTML parsing error: {e}")
                
    except Exception as e:
        logger.error(f"Headers/Performance scan error: {e}")
        results["headers"]["error"] = str(e)


def _detect_cdn(headers) -> str:
    if 'cf-ray' in headers: return 'Cloudflare'
    if 'x-amz-cf-id' in headers: return 'CloudFront'
    if 'x-served-by' in headers: return 'Fastly'
    if 'x-akamai' in headers: return 'Akamai'
    if 'x-vercel-id' in headers: return 'Vercel'
    return 'Unknown'


async def _scan_email_security(domain: str, email_results: Dict[str, Any]) -> None:
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5.0
        resolver.lifetime = 5.0
        
        # SPF
        try:
            answers = resolver.resolve(domain, "TXT")
            spf = next((str(r) for r in answers if "v=spf1" in str(r)), None)
            email_results["spf"] = {"present": bool(spf), "record": spf}
        except Exception:
            email_results["spf"] = {"present": False, "record": None}

        # DMARC
        try:
            answers = resolver.resolve(f"_dmarc.{domain}", "TXT")
            dmarc = next((str(r) for r in answers if "v=DMARC1" in str(r)), None)
            email_results["dmarc"] = {"present": bool(dmarc), "record": dmarc}
        except Exception:
            email_results["dmarc"] = {"present": False, "record": None}

        # DKIM
        selectors = ['google', 'default', 'selector1', 'selector2', 'k1', 'mandrill', 'mailchimp', 'dkim']
        dkim_records = []
        for selector in selectors:
            try:
                answers = resolver.resolve(f"{selector}._domainkey.{domain}", "TXT")
                for r in answers:
                    dkim_records.append({"selector": selector, "record": str(r)})
            except Exception:
                pass
        email_results["dkim"] = {"present": len(dkim_records) > 0, "records": dkim_records}

    except Exception as e:
        logger.error(f"Email security scan error: {e}")
        email_results["error"] = str(e)
