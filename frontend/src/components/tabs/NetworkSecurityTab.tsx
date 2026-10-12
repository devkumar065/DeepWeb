"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Globe,
  Server,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileCode,
  Gauge,
  Mail,
  Zap
} from "lucide-react";

/* ─── helpers ───────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(raw: string | null | undefined): string {
  if (!raw || raw === "None") return "N/A";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return raw;
  }
}

function formatDomainAge(days: number | null | undefined): string {
  if (!days) return "N/A";
  if (days > 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
  if (days > 30) return `${Math.floor(days / 30)} months`;
  return `${days} days`;
}

/* ─── main component ───────────────────────────────── */

export default function NetworkSecurityTab() {
  const { url, networkSecurity, setNetworkSecurity } = useAnalysisStore();
  const [loading, setLoading] = useState(!networkSecurity);
  const [error, setError] = useState<string | null>(null);
  const [headersExpanded, setHeadersExpanded] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post("/network/scan", { url });
      setNetworkSecurity(res.data);
    } catch (err: unknown) {
      console.error("Network scan error:", err);
      setError("Failed to fetch network & security telemetry. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (networkSecurity) {
      setLoading(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <NetworkSkeleton />;

  if (error) {
    return (
      <div className="bg-surface border border-error/30 rounded-2xl p-8 shadow-sm text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-error/10 border border-error/20 flex items-center justify-center text-error mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-foreground mb-1">Security Scan Error</h4>
        <p className="text-xs text-muted mb-4">{error}</p>
        <button
          onClick={() => {
            setNetworkSecurity(null as unknown as Record<string, unknown>);
            fetchData();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Scan
        </button>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = networkSecurity as Record<string, any> | null;
  if (!d) return null;

  // ── Extract backend shapes ──
  const dns = d.dns || {};
  const dnsRecords: Record<string, string[]> = dns.records || {};
  const geo = dns.geolocation || {};
  const whoisData = d.whois || {};
  const sslData = d.ssl || {};
  const headersData = d.headers || {};
  const emailData = d.email_security || {};
  const perfData = d.performance || {};
  const a11yData = d.accessibility || {};

  // Flatten DNS records into rows
  const dnsRows: { type: string; value: string }[] = [];
  for (const [type, values] of Object.entries(dnsRecords)) {
    if (Array.isArray(values)) {
      for (const v of values) {
        dnsRows.push({ type, value: v });
      }
    }
  }

  // Security headers map
  const secHeadersMap: Record<string, { present: boolean; value: string | null }> = headersData.security_headers || {};
  const secHeaders = Object.entries(secHeadersMap).map(([name, info]) => ({
    name,
    present: info?.present ?? false,
    value: info?.value ?? null,
  }));

  // SSL SAN list
  const sanList: string[] = Array.isArray(sslData.san)
    ? sslData.san.map((entry: string[] | string) =>
        Array.isArray(entry) ? entry[1] || entry[0] : entry
      )
    : [];

  // SSL issuer / subject
  const issuerStr = sslData.issuer
    ? (sslData.issuer.organizationName || sslData.issuer.commonName || JSON.stringify(sslData.issuer))
    : "N/A";
  const subjectStr = sslData.subject
    ? (sslData.subject.commonName || JSON.stringify(sslData.subject))
    : "N/A";

  const cdnName = headersData.cdn || "Unknown";
  const cdnDetected = cdnName !== "Unknown";
  const redirectChain: { url: string; status: number }[] = headersData.redirect_chain || [];
  const cookies: { name: string; value: string }[] = headersData.cookies || [];

  const nameservers: string[] = Array.isArray(whoisData.name_servers) ? whoisData.name_servers : [];
  const domainStatus: string[] = Array.isArray(whoisData.status)
    ? whoisData.status
    : typeof whoisData.status === "string"
    ? [whoisData.status]
    : [];

  const hasHsts = secHeadersMap["Strict-Transport-Security"]?.present ?? false;

  return (
    <div className="space-y-6">
      {/* ─── SECTION 1: DNS & Network ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent" />
            <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              DNS Routing & Geolocation
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {cdnDetected && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20 font-mono">
                CDN: {cdnName}
              </span>
            )}
            {dns.dnssec !== undefined && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono ${
                dns.dnssec
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-surface-elevated text-muted border-border"
              }`}>
                DNSSEC: {dns.dnssec ? "Enabled" : "Disabled"}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: IPs + Geolocation details */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                IPv4 Resolution (A Records)
              </div>
              <div className="flex flex-wrap gap-2">
                {(dnsRecords.A || []).length > 0 ? (
                  dnsRecords.A.map((ip, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-surface-elevated border border-border rounded-lg text-xs font-mono font-medium text-foreground"
                    >
                      {ip}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted italic">No A record found</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                IPv6 Resolution (AAAA Records)
              </div>
              <div className="flex flex-wrap gap-2">
                {(dnsRecords.AAAA || []).length > 0 ? (
                  dnsRecords.AAAA.map((ip, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-surface-elevated border border-border rounded-lg text-xs font-mono font-medium text-foreground break-all"
                    >
                      {ip}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted italic">No IPv6 (AAAA) record found</span>
                )}
              </div>
            </div>

            {/* ISP & Geo */}
            <div className="p-3.5 bg-surface-elevated rounded-xl border border-border space-y-2 text-xs">
              {geo.as && (
                <div className="flex justify-between items-center">
                  <span className="text-muted font-medium">Autonomous System (ASN)</span>
                  <span className="font-mono text-foreground font-semibold">{geo.as}</span>
                </div>
              )}
              {geo.isp && (
                <div className="flex justify-between items-center">
                  <span className="text-muted font-medium">ISP / Cloud Provider</span>
                  <span className="text-foreground font-medium">{geo.isp}</span>
                </div>
              )}
              {(geo.city || geo.country) && (
                <div className="flex justify-between items-center">
                  <span className="text-muted font-medium">Physical Location</span>
                  <span className="text-foreground font-medium flex items-center gap-1">
                    📍 {[geo.city, geo.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {dns.ptr && dns.ptr.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted font-medium">PTR Reverse DNS</span>
                  <span className="font-mono text-foreground-secondary truncate max-w-[220px]">
                    {dns.ptr.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: DNS Records Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Full Zone Records ({dnsRows.length})
              </span>
            </div>
            <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
              <div className="max-h-[250px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface sticky top-0 border-b border-border">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-muted w-20">Type</th>
                      <th className="px-3 py-2 font-semibold text-muted">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dnsRows.length > 0 ? (
                      dnsRows.map((r, i) => (
                        <tr key={`${r.type}-${i}`} className="hover:bg-surface/60 transition-colors">
                          <td className="px-3 py-2 font-mono text-accent font-bold">{r.type}</td>
                          <td className="px-3 py-2 font-mono text-foreground-secondary break-all">{r.value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-3 py-4 text-center text-muted italic">
                          No DNS records returned
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── SECTION 2: Domain & WHOIS ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-surface border border-border rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-accent" />
          <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
            Domain Registration & WHOIS
          </h3>
        </div>

        {whoisData.error ? (
          <div className="text-xs text-muted italic">Unable to fetch WHOIS: {whoisData.error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">Registrar</div>
              <div className="text-sm font-semibold text-foreground truncate" title={whoisData.registrar}>
                {whoisData.registrar || "Unknown"}
              </div>
            </div>

            <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">Domain Age</div>
              <div className="text-sm font-semibold text-foreground">
                {formatDomainAge(whoisData.domain_age_days)}
              </div>
              <div className="text-[11px] text-muted font-mono mt-0.5">
                Created: {formatDate(whoisData.creation_date)}
              </div>
            </div>

            <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">Expiration</div>
              <div className="text-sm font-semibold text-foreground">
                {formatDate(whoisData.expiration_date)}
              </div>
            </div>

            <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">Authoritative NS</div>
              <div className="flex flex-col gap-1 max-h-16 overflow-y-auto">
                {nameservers.length > 0 ? (
                  nameservers.map((ns, i) => (
                    <span key={i} className="text-[11px] font-mono text-foreground-secondary truncate">
                      {ns.toLowerCase()}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted italic">N/A</span>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── SECTION 3: SSL/TLS Certificate ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              SSL / TLS Certificate Encryption
            </h3>
          </div>
          {sslData.error ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-error/10 text-error border border-error/20">
              <XCircle className="w-3.5 h-3.5" />
              Certificate Error
            </span>
          ) : sslData.days_remaining !== undefined && sslData.days_remaining !== null ? (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
              sslData.days_remaining > 0
                ? "bg-success/10 text-success border-success/20"
                : "bg-error/10 text-error border-error/20"
            }`}>
              {sslData.days_remaining > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {sslData.days_remaining > 0 ? "Valid Certificate" : "Expired"}
            </span>
          ) : null}
        </div>

        {sslData.error ? (
          <div className="text-xs text-muted italic">Unable to inspect SSL certificate: {sslData.error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
                <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">Issuer Authority</div>
                <div className="text-sm font-semibold text-foreground truncate" title={issuerStr}>
                  {issuerStr}
                </div>
              </div>

              <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
                <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">Common Name (CN)</div>
                <div className="text-sm font-mono font-medium text-foreground truncate" title={subjectStr}>
                  {subjectStr}
                </div>
              </div>

              <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
                <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">Validity Timeline</div>
                <div className="text-xs font-mono text-foreground-secondary space-y-0.5">
                  <div>Valid From: {sslData.notBefore || "N/A"}</div>
                  <div>Expires: {sslData.notAfter || "N/A"}</div>
                </div>
              </div>

              <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
                <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">Days Remaining</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold font-mono ${
                    (sslData.days_remaining ?? 0) > 30
                      ? "text-success"
                      : (sslData.days_remaining ?? 0) > 0
                      ? "text-warning"
                      : "text-error"
                  }`}>
                    {sslData.days_remaining ?? "N/A"}
                  </span>
                  <span className="text-xs text-muted">days until renewal</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-surface-elevated rounded-xl border border-border space-y-2">
                <div className="text-[10px] font-semibold tracking-wider uppercase text-muted">Protocol Security</div>
                <div className="flex flex-wrap gap-2">
                  {sslData.tls_version && (
                    <span className="px-2 py-0.5 bg-surface border border-border rounded text-xs font-mono font-semibold text-foreground">
                      {sslData.tls_version}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
                    hasHsts
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-surface text-muted border-border"
                  }`}>
                    HSTS: {hasHsts ? "Enforced" : "None"}
                  </span>
                </div>
              </div>

              {sanList.length > 0 && (
                <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
                  <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1.5">
                    Subject Alternative Names ({sanList.length})
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {sanList.map((san, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-surface border border-border text-foreground-secondary rounded text-[10px] font-mono"
                      >
                        {san}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── SECTION 4: HTTP Security Headers ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-surface border border-border rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              HTTP Security Headers Audit
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {headersData.http_version && (
              <span className="px-2.5 py-0.5 bg-surface-elevated border border-border rounded text-xs font-mono text-muted">
                {headersData.http_version}
              </span>
            )}
            {headersData.compression && headersData.compression !== "none" && (
              <span className="px-2.5 py-0.5 bg-accent/10 border border-accent/20 rounded text-xs font-mono text-accent">
                {headersData.compression}
              </span>
            )}
          </div>
        </div>

        {headersData.error ? (
          <div className="text-xs text-muted italic">Unable to audit headers: {headersData.error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Configured Defense Policies
                </span>
                <span className="text-xs font-mono text-muted">
                  {secHeaders.filter((h) => h.present).length} of {secHeaders.length} Enforced
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {secHeaders.map((header, i) => (
                  <div
                    key={i}
                    className="p-3 bg-surface-elevated rounded-xl border border-border flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-semibold text-foreground truncate" title={header.name}>
                        {header.name}
                      </div>
                      {header.present && header.value && (
                        <div className="text-[11px] text-muted font-mono mt-1 truncate max-w-[200px]" title={header.value}>
                          {header.value}
                        </div>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        header.present
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-error/10 text-error border-error/20"
                      }`}
                    >
                      {header.present ? "Pass" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>

              {cookies.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Active Cookies ({cookies.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cookies.map((cookie, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1 bg-surface-elevated border border-border rounded-lg text-xs font-mono text-foreground"
                      >
                        {cookie.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Redirect chain & Raw headers inspection */}
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Redirect Resolution Flow
                </div>
                {redirectChain.length > 1 ? (
                  <div className="relative border-l-2 border-border ml-2 pl-4 py-1 space-y-4">
                    {redirectChain.map((hop, i) => (
                      <div key={i} className="relative">
                        <div
                          className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                            hop.status >= 400
                              ? "bg-error"
                              : hop.status >= 300
                              ? "bg-warning"
                              : "bg-success"
                          }`}
                        />
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                              hop.status >= 400
                                ? "bg-error/10 text-error border-error/20"
                                : hop.status >= 300
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-success/10 text-success border-success/20"
                            }`}
                          >
                            {hop.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted font-mono break-all">{hop.url}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted italic p-3 bg-surface-elevated rounded-xl border border-border">
                    Direct 200 OK response (no redirects)
                  </div>
                )}
              </div>

              {/* Raw headers drawer */}
              <div className="pt-2">
                <button
                  onClick={() => setHeadersExpanded(!headersExpanded)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-border text-xs font-medium text-foreground hover:border-border-hover transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-accent" />
                    {headersExpanded ? "Hide Telemetry Headers" : "View Raw Response Headers"}
                  </span>
                  {headersExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {headersExpanded && (
                  <div className="mt-2 p-3.5 bg-surface-elevated rounded-xl border border-border text-xs font-mono max-h-60 overflow-y-auto space-y-1">
                    <div className="text-muted text-[10px] pb-1 border-b border-border/50">
                      // Response Headers Captured
                    </div>
                    {secHeaders.map(
                      (h) =>
                        h.present &&
                        h.value && (
                          <div key={h.name} className="break-all">
                            <span className="text-accent font-semibold">{h.name}:</span>{" "}
                            <span className="text-foreground-secondary">{h.value}</span>
                          </div>
                        )
                    )}
                    {headersData.compression && (
                      <div>
                        <span className="text-accent font-semibold">Content-Encoding:</span>{" "}
                        <span className="text-foreground-secondary">{headersData.compression}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── Bottom grid: Email Security + Performance + A11y ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 5: Email Security */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent" />
            <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              Domain Email Authentication (SPF / DKIM / DMARC)
            </h3>
          </div>

          {emailData.error ? (
            <div className="text-xs text-muted italic">Unable to audit email security</div>
          ) : (
            <div className="space-y-3">
              {/* SPF */}
              <div className="p-3 bg-surface-elevated rounded-xl border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-foreground">Sender Policy Framework (SPF)</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      emailData.spf?.present
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-error/10 text-error border-error/20"
                    }`}
                  >
                    {emailData.spf?.present ? "Configured" : "Missing"}
                  </span>
                </div>
                <div className="text-xs font-mono text-muted break-all">
                  {emailData.spf?.record || "No SPF TXT record published"}
                </div>
              </div>

              {/* DKIM */}
              <div className="p-3 bg-surface-elevated rounded-xl border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-foreground">DomainKeys Identified Mail (DKIM)</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      emailData.dkim?.present
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-surface text-muted border-border"
                    }`}
                  >
                    {emailData.dkim?.present ? "Detected" : "Unverified"}
                  </span>
                </div>
                {emailData.dkim?.records && emailData.dkim.records.length > 0 ? (
                  <div className="text-xs text-muted space-y-1">
                    {emailData.dkim.records.map((rec: { selector: string; record: string }, i: number) => (
                      <div key={i} className="font-mono text-[11px]">
                        Selector: <span className="font-semibold text-foreground">{rec.selector}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted">Standard DNS selector scan completed</div>
                )}
              </div>

              {/* DMARC */}
              <div className="p-3 bg-surface-elevated rounded-xl border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-foreground">DMARC Policy</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      emailData.dmarc?.present
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-error/10 text-error border-error/20"
                    }`}
                  >
                    {emailData.dmarc?.present ? "Enforced" : "Missing"}
                  </span>
                </div>
                <div className="text-xs font-mono text-muted break-all">
                  {emailData.dmarc?.record || "No DMARC record on _dmarc subdomain"}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* SECTION 6: Performance & Accessibility Telemetry */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-surface border border-border rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-accent" />
              <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
                Network Latency & Payload
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
                <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">Time to First Byte</div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {perfData.ttfb_seconds !== undefined ? (
                    <>
                      {(perfData.ttfb_seconds * 1000).toFixed(0)}{" "}
                      <span className="text-xs font-normal text-muted font-sans">ms</span>
                    </>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
                <div className="text-[10px] font-semibold tracking-wider uppercase text-muted mb-1">HTML Response Weight</div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {perfData.page_size_bytes !== undefined ? formatBytes(perfData.page_size_bytes) : "N/A"}
                </div>
              </div>
            </div>

            {perfData.resource_counts && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-surface-elevated border border-border">
                  <div className="text-sm font-bold font-mono text-foreground">{perfData.resource_counts.images || 0}</div>
                  <div className="text-[10px] uppercase text-muted font-semibold">Images</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-surface-elevated border border-border">
                  <div className="text-sm font-bold font-mono text-foreground">{perfData.resource_counts.scripts || 0}</div>
                  <div className="text-[10px] uppercase text-muted font-semibold">Scripts</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-surface-elevated border border-border">
                  <div className="text-sm font-bold font-mono text-foreground">{perfData.resource_counts.stylesheets || 0}</div>
                  <div className="text-[10px] uppercase text-muted font-semibold">Styles</div>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-4 h-4 text-accent" />
              <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
                Accessibility Baseline
              </h3>
            </div>

            <div className="space-y-3">
              {a11yData.images_missing_alt_percentage !== undefined && (
                <div className="p-3 bg-surface-elevated rounded-xl border border-border">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-foreground">Images Missing Alt Text</span>
                    <span className="font-mono text-foreground font-semibold">
                      {a11yData.images_missing_alt_percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden border border-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(a11yData.images_missing_alt_percentage, 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${
                        a11yData.images_missing_alt_percentage > 50
                          ? "bg-error"
                          : a11yData.images_missing_alt_percentage > 20
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl border border-border">
                <span className="text-xs font-medium text-foreground">HTML Language Attribute</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    a11yData.has_lang_attribute
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-error/10 text-error border-error/20"
                  }`}
                >
                  {a11yData.has_lang_attribute ? "Present" : "Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl border border-border">
                <span className="text-xs font-medium text-foreground">ARIA Landmarks Discovered</span>
                <span className="px-2 py-0.5 bg-surface text-foreground font-mono rounded text-[10px] font-semibold border border-border">
                  {a11yData.aria_landmarks ?? "N/A"} regions
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton Loader ─── */
function NetworkSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
        <span className="text-xs text-muted font-medium">Gathering network, DNS, and security telemetry...</span>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <Skeleton className="h-4 w-36" />
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-7 w-28" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <Skeleton className="h-4 w-44" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
