// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";

export default function OverviewTab() {
  const { overview, brand, step } = useAnalysisStore();
  const isLoading = !overview && step === "analyzing";

  if (isLoading) return <OverviewSkeleton />;
  if (!overview) return <EmptyState />;

  const ov = overview as Record<string, unknown>;
  const br = brand as Record<string, unknown> | null;

  return (
    <div className="space-y-8">
      {/* Title Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="intel-card"
      >
        <div className="flex items-start gap-6">
          {ov.favicon && (
            <img
              src={(ov.favicon as string) || ""}
              alt="favicon"
              className="w-12 h-12 rounded-xl border border-neutral-700 p-1 bg-neutral-800 flex-shrink-0"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{String(ov.title || "—")}</h2>
            <p className="text-neutral-400 text-sm mt-1 line-clamp-2">{String(ov.meta_description || "No meta description")}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="data-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                {String((ov.language as string)?.toUpperCase() || "EN")}
              </span>
              {ov.domain_age && (
                <span className="data-badge">🕐 {String(ov.domain_age)}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Framework" value={String(ov.framework || "")} />
        <MetricCard label="CMS" value={String(ov.cms || "")} />
        <MetricCard label="CDN" value={String(ov.cdn || "")} />
        <MetricCard label="Hosting" value={String(ov.hosting || "")} />
      </div>

      {/* Analytics */}
      {(ov.analytics as string[])?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="intel-card"
        >
          <div className="section-label mb-4">Analytics & Tracking</div>
          <div className="flex flex-wrap gap-2">
            {(ov.analytics as string[]).map((a) => (
              <span key={a} className="tech-badge text-xs">{a}</span>
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
          className="intel-card"
        >
          <div className="section-label mb-4">Brand Colors</div>
          <div className="flex flex-wrap gap-2">
            {(br.colors as Array<{hex: string; rgb: string}>).slice(0, 10).map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-md border border-neutral-700 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                  title={`${c.hex} · ${c.rgb}`}
                />
                <span className="text-[10px] font-mono text-neutral-600">{c.hex.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Fonts */}
      {br?.fonts && (br.fonts as unknown[]).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="intel-card"
        >
          <div className="section-label mb-4">Typography</div>
          <div className="space-y-3">
            {(br.fonts as Array<{family: string; weights?: string[]; source?: string}>).map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                <span className="text-sm font-medium" style={{ fontFamily: f.family }}>{f.family}</span>
                <div className="flex items-center gap-2">
                  {f.weights?.map((w) => (
                    <span key={w} className="text-[10px] text-neutral-500 font-mono">{w}</span>
                  ))}
                  {f.source && <span className="intel-tag">{f.source}</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Logo URLs */}
      {br?.logo_urls && (br.logo_urls as string[]).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="intel-card"
        >
          <div className="section-label mb-4">Detected Logos</div>
          <div className="flex flex-wrap gap-4">
            {(br.logo_urls as string[]).map((logoUrl, i) => (
              <div key={i} className="bg-neutral-800 rounded-lg p-4 flex items-center justify-center h-20 w-40 border border-neutral-700">
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

function MetricCard({ label, value }: { label: string; value: unknown }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="section-label mb-2">{label}</div>
      <div className="text-base font-semibold truncate">{(value as string) || "—"}</div>
    </motion.div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="intel-card">
        <div className="flex gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-neutral-600">
      <div className="text-4xl mb-4">◎</div>
      <p className="text-sm">Analysis pending...</p>
    </div>
  );
}
