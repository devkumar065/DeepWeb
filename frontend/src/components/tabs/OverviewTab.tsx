// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Copy, ExternalLink, Globe, Clock, Layers, Sparkles } from "lucide-react";

export default function OverviewTab() {
  const { overview, brand, step, url } = useAnalysisStore();
  const isLoading = !overview && (step === "analyzing" || step === "fetching" || step === "rendering");

  if (isLoading) return <OverviewSkeleton />;
  if (!overview) return <EmptyState />;

  const ov = overview as Record<string, unknown>;
  const br = brand as Record<string, unknown> | null;

  const copyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    toast.success(`Copied ${hex.toUpperCase()} to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Title / Hero Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-xs hover:border-border-hover transition-all duration-200"
      >
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {ov.favicon && (
            <img
              src={(ov.favicon as string) || ""}
              alt="favicon"
              className="w-14 h-14 rounded-2xl border border-border p-1.5 bg-surface-elevated flex-shrink-0 shadow-2xs"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground truncate">
                {String(ov.title || "Untitled Website")}
              </h1>
              {ov.domain && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-muted hover:text-accent transition-colors"
                >
                  <span>{String(ov.domain)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <p className="text-muted text-sm mt-2 leading-relaxed line-clamp-2 font-sans">
              {String(ov.meta_description || "No meta description provided on the target root page.")}
            </p>

            <div className="flex items-center gap-2.5 mt-4 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-elevated text-foreground font-mono font-medium border border-border">
                <Globe className="w-3 h-3 text-muted" />
                {String((ov.language as string)?.toUpperCase() || "EN")}
              </span>

              {ov.domain_age && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-elevated text-muted font-mono border border-border">
                  <Clock className="w-3 h-3" />
                  {String(ov.domain_age)}
                </span>
              )}

              {ov.pages_found !== undefined && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-elevated text-muted font-mono border border-border">
                  <Layers className="w-3 h-3" />
                  {String(ov.pages_found)} pages
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Infrastructure & Tech Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Frontend Framework" value={String(ov.framework || "—")} icon="⚡" />
        <MetricCard label="CMS Platform" value={String(ov.cms || "Custom / None")} icon="📄" />
        <MetricCard label="CDN / Edge Network" value={String(ov.cdn || "Direct DNS")} icon="🌐" />
        <MetricCard label="Hosting Infrastructure" value={String(ov.hosting || "Cloud")} icon="☁️" />
      </div>

      {/* Analytics & Tracking */}
      {(ov.analytics as string[])?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-2xl p-6 shadow-xs"
        >
          <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-4">
            Analytics, Pixels & Telemetry
          </div>
          <div className="flex flex-wrap gap-2">
            {(ov.analytics as string[]).map((a) => (
              <span 
                key={a} 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs font-mono text-foreground font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {a}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Brand Colors Preview */}
      {br?.colors && (br.colors as unknown[]).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border border-border rounded-2xl p-6 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted">
              Extracted Brand Color System
            </div>
            <span className="text-xs text-muted font-mono">Click swatch to copy HEX</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {(br.colors as Array<{hex: string; rgb: string}>).slice(0, 12).map((c, i) => (
              <div 
                key={i} 
                onClick={() => copyHex(c.hex)}
                className="group cursor-pointer p-2.5 rounded-xl bg-surface-elevated border border-border hover:border-border-hover transition-all duration-150 flex flex-col gap-2"
              >
                <div
                  className="w-full h-12 rounded-lg border border-border/80 shadow-2xs group-hover:scale-[1.02] transition-transform"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground">{c.hex.toUpperCase()}</span>
                  <Copy className="w-3 h-3 text-muted group-hover:text-accent transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Typography Preview */}
      {br?.fonts && (br.fonts as unknown[]).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-2xl p-6 shadow-xs"
        >
          <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-4">
            Detected Font Families
          </div>
          <div className="divide-y divide-border">
            {(br.fonts as Array<{family: string; weights?: string[]; source?: string}>).map((f, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2 first:pt-0 last:pb-0">
                <span className="text-base font-semibold text-foreground" style={{ fontFamily: f.family }}>
                  {f.family}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {f.weights?.map((w) => (
                    <span key={w} className="text-[11px] text-muted font-mono px-2 py-0.5 rounded bg-surface-elevated border border-border">
                      {w}
                    </span>
                  ))}
                  {f.source && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold">
                      {f.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Detected Logos */}
      {br?.logo_urls && (br.logo_urls as string[]).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface border border-border rounded-2xl p-6 shadow-xs"
        >
          <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-4">
            Brand Logos
          </div>
          <div className="flex flex-wrap gap-4">
            {(br.logo_urls as string[]).map((logoUrl, i) => (
              <div 
                key={i} 
                className="bg-surface-elevated rounded-xl p-4 flex items-center justify-center h-22 w-44 border border-border hover:border-border-hover transition-colors"
              >
                <img
                  src={logoUrl}
                  alt={`Logo ${i + 1}`}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-border-hover transition-all duration-150"
    >
      <div className="flex items-center justify-between text-muted mb-2">
        <span className="text-[10px] font-mono font-semibold tracking-wider uppercase">{label}</span>
        {icon && <span className="text-xs">{icon}</span>}
      </div>
      <div className="text-base font-bold font-mono text-foreground truncate">
        {value}
      </div>
    </motion.div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-2xl p-7">
        <div className="flex gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-muted bg-surface border border-border rounded-2xl">
      <div className="text-3xl mb-3 text-accent font-serif font-bold">◎</div>
      <p className="text-sm font-medium text-foreground">Overview Data Pending</p>
      <p className="text-xs text-muted mt-1">Start a scan to extract website intelligence</p>
    </div>
  );
}
