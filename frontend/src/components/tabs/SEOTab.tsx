// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";

interface SEOItem {
  label: string;
  value: unknown;
  type?: "url" | "text" | "list" | "badge" | "score";
}

function SEORow({ label, value, type = "text" }: SEOItem) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return (
      <div className="flex items-start gap-4 py-3 border-b border-neutral-800 last:border-0">
        <div className="w-1/3 text-xs text-neutral-500 pt-0.5 flex-shrink-0">{label}</div>
        <div className="text-xs text-neutral-700 italic">Not set</div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 py-3 border-b border-neutral-800 last:border-0">
      <div className="w-1/3 text-xs text-neutral-500 pt-0.5 flex-shrink-0">{label}</div>
      <div className="flex-1 min-w-0">
        {type === "list" && Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1">
            {(value as string[]).map((v, i) => (
              <span key={i} className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">{v}</span>
            ))}
          </div>
        ) : type === "url" ? (
          <a href={value as string} target="_blank" rel="noopener noreferrer"
            className="text-xs font-mono text-neutral-300 hover:text-white break-all underline underline-offset-2">
            {value as string}
          </a>
        ) : type === "badge" ? (
          <span className="inline-block text-[10px] font-semibold bg-neutral-700 text-neutral-200 px-2 py-0.5 rounded">
            {value as string}
          </span>
        ) : (
          <span className="text-xs text-neutral-200 break-words">{String(value)}</span>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-8 text-right">{score}</span>
    </div>
  );
}

export default function SEOTab() {
  const { seo, step } = useAnalysisStore();
  const isLoading = !seo && step === "analyzing";

  if (isLoading) return <SEOSkeleton />;
  if (!seo) return <EmptyState />;

  const s = seo as Record<string, unknown>;

  // Calculate a rough SEO score
  let score = 0;
  if (s.title) score += 15;
  if (s.meta_description) score += 15;
  if (s.canonical) score += 10;
  if (s.og_title) score += 10;
  if (s.og_image) score += 10;
  if (s.twitter_card) score += 10;
  if ((s.schema_types as string[])?.length > 0) score += 15;
  if ((s.keywords as string[])?.length > 0) score += 5;
  if (s.sitemap_url) score += 5;
  if ((s.hreflang as unknown[])?.length > 0) score += 5;

  const structuredData = (s.structured_data as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      {/* SEO Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="intel-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="section-label">SEO Score</div>
          <div className="text-3xl font-bold tabular-nums">{score}<span className="text-neutral-600 text-lg">/100</span></div>
        </div>
        <ScoreBar score={score} />
        <div className="grid grid-cols-4 gap-3 mt-4 text-center">
          {[
            { label: "Title", ok: !!s.title },
            { label: "Meta Desc", ok: !!s.meta_description },
            { label: "OG Tags", ok: !!s.og_title },
            { label: "Schema", ok: (s.schema_types as string[])?.length > 0 },
            { label: "Canonical", ok: !!s.canonical },
            { label: "Twitter Card", ok: !!s.twitter_card },
            { label: "Sitemap", ok: !!s.sitemap_url },
            { label: "Hreflang", ok: (s.hreflang as unknown[])?.length > 0 },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                item.ok ? "bg-white text-black" : "bg-neutral-800 text-neutral-600"
              }`}>
                {item.ok ? "✓" : "✗"}
              </div>
              <span className="text-[9px] text-neutral-500">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Meta Tags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="intel-card"
      >
        <div className="section-label mb-4">Meta Tags</div>
        <SEORow label="Title" value={s.title} />
        <SEORow label="Meta Description" value={s.meta_description} />
        <SEORow label="Canonical URL" value={s.canonical} type="url" />
        <SEORow label="Robots" value={s.robots} type="badge" />
        <SEORow label="Keywords" value={s.keywords} type="list" />
      </motion.div>

      {/* Open Graph */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="intel-card"
      >
        <div className="section-label mb-4">Open Graph</div>
        <SEORow label="OG Title" value={s.og_title} />
        <SEORow label="OG Description" value={s.og_description} />
        <SEORow label="OG Image" value={s.og_image} type="url" />
        <SEORow label="OG Type" value={s.og_type} type="badge" />
        {s.og_image && (
          <div className="mt-3">
            <img
              src={s.og_image as string}
              alt="OG Image"
              className="rounded-lg max-h-48 object-cover border border-neutral-700"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}
      </motion.div>

      {/* Twitter Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="intel-card"
      >
        <div className="section-label mb-4">Twitter / X Card</div>
        <SEORow label="Card Type" value={s.twitter_card} type="badge" />
        <SEORow label="Title" value={s.twitter_title} />
        <SEORow label="Description" value={s.twitter_description} />
        <SEORow label="Image" value={s.twitter_image} type="url" />
      </motion.div>

      {/* Hreflang */}
      {(s.hreflang as unknown[])?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="intel-card"
        >
          <div className="section-label mb-4">Hreflang ({(s.hreflang as unknown[]).length})</div>
          <div className="space-y-2">
            {(s.hreflang as Array<{ lang: string; url: string }>).map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded w-16 text-center flex-shrink-0">{h.lang}</span>
                <a href={h.url} className="text-xs text-neutral-400 hover:text-white font-mono truncate">{h.url}</a>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Structured Data */}
      {structuredData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="intel-card"
        >
          <div className="section-label mb-4">Structured Data / Schema ({structuredData.length})</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(s.schema_types as string[]).map((type) => (
              <span key={type} className="tech-badge text-xs">{type}</span>
            ))}
          </div>
          <div className="bg-neutral-950 rounded-lg p-4 overflow-auto max-h-64">
            <pre className="text-xs font-mono text-neutral-400 whitespace-pre-wrap">
              {JSON.stringify(structuredData[0], null, 2)}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SEOSkeleton() {
  return (
    <div className="space-y-6">
      <div className="intel-card space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-1 w-full" />
        <div className="grid grid-cols-8 gap-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="intel-card space-y-3">
          <Skeleton className="h-3 w-24" />
          {[...Array(4)].map((_, j) => (
            <div key={j} className="flex gap-4 py-3 border-b border-neutral-800">
              <Skeleton className="h-3 w-24 flex-shrink-0" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-neutral-600">
      <div className="text-4xl mb-4">⊕</div>
      <p className="text-sm">SEO analysis pending...</p>
    </div>
  );
}
