"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { getPageTypeColor, toTitleCase } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ExternalLink, Copy, Check, FileText } from "lucide-react";
import { toast } from "sonner";

const PAGE_TYPES = [
  "all", "homepage", "about", "services", "pricing", "blog",
  "portfolio", "case_studies", "careers", "contact", "terms", "privacy", "custom",
];

export default function PagesTab() {
  const { pages, step } = useAnalysisStore();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const isLoading = pages.length === 0 && (step === "crawling" || step === "rendering");

  const filtered = pages.filter((p) => {
    const matchType = filter === "all" || p.type === filter;
    const matchSearch = !search || p.url.toLowerCase().includes(search.toLowerCase()) ||
      (p.title || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const counts = pages.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const copyUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedUrl(url);
    toast.success("Page URL copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-1">
            Site Architecture
          </div>
          <h2 className="text-2xl font-bold font-serif text-foreground tabular-nums">
            {pages.length} Discovered Pages
          </h2>
        </div>

        {step === "crawling" && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Crawling site graph...</span>
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {PAGE_TYPES.filter((t) => t === "all" || counts[t]).map((type) => {
          const isSelected = filter === type;
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer ${
                isSelected
                  ? "bg-accent text-accent-foreground border-accent shadow-2xs font-semibold"
                  : "bg-surface text-muted hover:text-foreground border-border hover:border-border-hover"
              }`}
            >
              <span>{toTitleCase(type === "all" ? "All Pages" : type)}</span>
              <span className={`ml-1.5 font-mono text-[10px] ${isSelected ? "text-accent-foreground/80" : "text-muted"}`}>
                {type === "all" ? pages.length : counts[type] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter discovered pages by title, URL or path..."
          className="w-full bg-surface border border-border text-foreground text-sm pl-10 pr-4 py-2.5 rounded-xl placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 font-mono transition-all"
        />
      </div>

      {/* Pages List */}
      {isLoading ? (
        <PagesSkeleton />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-border rounded-2xl">
          <p className="text-sm text-foreground font-medium">No pages match your filter</p>
          <p className="text-xs text-muted mt-1">Try clearing the search input or selecting 'All Pages'.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((page, i) => (
            <motion.div
              key={page.url}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-surface border border-border rounded-xl hover:border-border-hover transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Depth visualizer dots */}
                <div className="flex gap-0.5 flex-shrink-0" title={`Crawl depth: ${page.depth}`}>
                  {[...Array(Math.min(page.depth + 1, 4))].map((_, di) => (
                    <div key={di} className="w-1 h-3.5 bg-accent/40 rounded-full" />
                  ))}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {page.title || "Untitled Page"}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${getPageTypeColor(page.type)}`}>
                      {page.type}
                    </span>
                    {page.status_code && (
                      <span className="text-[10px] font-mono text-success bg-success/10 px-1.5 py-0.5 rounded border border-success/20">
                        {page.status_code}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted font-mono truncate mt-0.5">
                    {page.url}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                <button
                  onClick={() => copyUrl(page.url)}
                  className="p-1.5 rounded-lg border border-border bg-surface-elevated text-muted hover:text-foreground hover:border-border-hover transition-colors"
                  title="Copy Page URL"
                  aria-label="Copy Page URL"
                >
                  {copiedUrl === page.url ? (
                    <Check className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-border bg-surface-elevated text-muted hover:text-foreground hover:border-border-hover transition-colors"
                  title="Open URL in new tab"
                  aria-label="Open URL in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PagesSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="p-4 bg-surface border border-border rounded-xl flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-80" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
