// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Copy, ExternalLink, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface SEOItem {
  label: string;
  value: unknown;
  type?: "url" | "text" | "list" | "badge" | "score";
}

function SEORow({ label, value, type = "text" }: SEOItem) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-3 border-b border-border last:border-0">
        <div className="w-full sm:w-1/3 text-xs font-mono font-medium text-muted pt-0.5 flex-shrink-0">{label}</div>
        <div className="text-xs text-muted/60 italic font-mono">Not set / None detected</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-3 border-b border-border last:border-0">
      <div className="w-full sm:w-1/3 text-xs font-mono font-medium text-muted pt-0.5 flex-shrink-0">{label}</div>
      <div className="flex-1 min-w-0">
        {type === "list" && Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1.5">
            {(value as string[]).map((v, i) => (
              <span key={i} className="text-xs font-mono bg-surface-elevated text-foreground px-2 py-0.5 rounded border border-border">
                {v}
              </span>
            ))}
          </div>
        ) : type === "url" ? (
          <a
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-foreground hover:text-accent break-all underline underline-offset-4 flex items-center gap-1.5"
          >
            <span>{value as string}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        ) : type === "badge" ? (
          <span className="inline-block text-xs font-mono font-semibold bg-surface-elevated text-foreground px-2.5 py-0.5 rounded border border-border">
            {value as string}
          </span>
        ) : (
          <span className="text-xs text-foreground font-sans leading-relaxed break-words">{String(value)}</span>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-muted">Health Index</span>
        <span className="font-bold text-foreground tabular-nums">{score}%</span>
      </div>
      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden border border-border/60">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function SEOTab() {
  const { seo, step } = useAnalysisStore();
  const isLoading = !seo && (step === "analyzing" || step === "fetching" || step === "rendering");

  if (isLoading) return <SEOSkeleton />;
  if (!seo) return <EmptyState />;

  const s = seo as Record<string, unknown>;

  // Calculate rough SEO score
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

  const copyJson = (data: unknown) => {
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    toast.success("Structured Schema copied to clipboard");
  };

  const checklist = [
    { label: "Title Tag", ok: !!s.title },
    { label: "Meta Description", ok: !!s.meta_description },
    { label: "Open Graph Tags", ok: !!s.og_title },
    { label: "Schema.org", ok: (s.schema_types as string[])?.length > 0 },
    { label: "Canonical URL", ok: !!s.canonical },
    { label: "Twitter / X Card", ok: !!s.twitter_card },
    { label: "XML Sitemap", ok: !!s.sitemap_url },
    { label: "Hreflang Localized", ok: (s.hreflang as unknown[])?.length > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* SEO Score Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-1">
              Search Engine Optimization Audit
            </div>
            <div className="text-3xl font-extrabold font-serif text-foreground tabular-nums flex items-baseline gap-1">
              <span>{score}</span>
              <span className="text-base font-sans text-muted">/100</span>
            </div>
          </div>
          <div className="w-full sm:w-64">
            <ScoreBar score={score} />
          </div>
        </div>

        {/* Audit Checklist Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-border">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-mono ${
                item.ok
                  ? "bg-success/5 border-success/20 text-success"
                  : "bg-surface-elevated border-border text-muted"
              }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                item.ok ? "bg-success text-white" : "bg-border text-muted"
              }`}>
                {item.ok ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span className="truncate font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Meta Tags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-surface border border-border rounded-2xl p-6 shadow-xs"
      >
        <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-4 pb-2 border-b border-border">
          Core Meta Tags
        </div>
        <SEORow label="Title Tag" value={s.title} />
        <SEORow label="Meta Description" value={s.meta_description} />
        <SEORow label="Canonical Link" value={s.canonical} type="url" />
        <SEORow label="Robots Directive" value={s.robots} type="badge" />
        <SEORow label="Keywords" value={s.keywords} type="list" />
      </motion.div>

      {/* Open Graph Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4"
      >
        <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted pb-2 border-b border-border">
          Open Graph Protocol (Facebook, LinkedIn, Slack)
        </div>
        <SEORow label="OG Title" value={s.og_title} />
        <SEORow label="OG Description" value={s.og_description} />
        <SEORow label="OG Type" value={s.og_type} type="badge" />
        <SEORow label="OG Image URL" value={s.og_image} type="url" />
        
        {s.og_image && (
          <div className="mt-3 p-3 bg-surface-elevated rounded-xl border border-border inline-block max-w-md">
            <span className="text-[10px] font-mono text-muted uppercase block mb-2">OG Image Preview</span>
            <img
              src={s.og_image as string}
              alt="OG Preview"
              className="rounded-lg max-h-48 w-full object-cover border border-border"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}
      </motion.div>

      {/* Twitter / X Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4"
      >
        <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted pb-2 border-b border-border">
          Twitter / X Card Metadata
        </div>
        <SEORow label="Card Format" value={s.twitter_card} type="badge" />
        <SEORow label="Twitter Title" value={s.twitter_title} />
        <SEORow label="Twitter Description" value={s.twitter_description} />
        <SEORow label="Twitter Image" value={s.twitter_image} type="url" />
      </motion.div>

      {/* Schema / Structured Data */}
      {structuredData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted">
              Structured JSON-LD Schema ({structuredData.length})
            </div>
            <button
              onClick={() => copyJson(structuredData)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-surface-elevated border border-border text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Schema</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(s.schema_types as string[]).map((type) => (
              <span key={type} className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-surface-elevated text-accent border border-border">
                @{type}
              </span>
            ))}
          </div>

          <div className="bg-surface-elevated rounded-xl p-4 overflow-auto max-h-72 border border-border">
            <pre className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap">
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
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-muted bg-surface border border-border rounded-2xl">
      <div className="text-3xl mb-3 text-accent font-serif font-bold">⊕</div>
      <p className="text-sm font-medium text-foreground">SEO Data Pending</p>
      <p className="text-xs text-muted mt-1">Start a scan to analyze search optimization</p>
    </div>
  );
}
