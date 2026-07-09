"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { getPageTypeColor, toTitleCase } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_TYPES = [
  "all", "homepage", "about", "services", "pricing", "blog",
  "portfolio", "case_studies", "careers", "contact", "terms", "privacy", "custom",
];

export default function PagesTab() {
  const { pages, step } = useAnalysisStore();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const isLoading = pages.length === 0 && step === "crawling";

  const filtered = pages.filter((p) => {
    const matchType = filter === "all" || p.type === filter;
    const matchSearch = !search || p.url.toLowerCase().includes(search.toLowerCase()) ||
      (p.title || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Count by type
  const counts = pages.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label mb-1">Discovered Pages</div>
          <h2 className="text-2xl font-bold tabular-nums">{pages.length}</h2>
        </div>
        {step === "crawling" && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Discovering...
          </div>
        )}
      </div>

      {/* Type breakdown */}
      <div className="flex flex-wrap gap-2">
        {PAGE_TYPES.filter((t) => t === "all" || counts[t]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              filter === type
                ? "bg-white text-black"
                : "bg-neutral-900 text-neutral-500 hover:text-white border border-neutral-800"
            }`}
          >
            {toTitleCase(type === "all" ? "All" : type)}
            <span className={`ml-1.5 ${filter === type ? "text-black/60" : "text-neutral-600"}`}>
              {type === "all" ? pages.length : counts[type] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search pages..."
        className="w-full bg-neutral-900 border border-neutral-800 text-white text-sm px-4 py-2.5 rounded-lg 
                   placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 font-mono"
      />

      {/* Pages List */}
      {isLoading ? (
        <PagesSkeleton />
      ) : (
        <div className="space-y-1">
          {filtered.map((page, i) => (
            <motion.div
              key={page.url}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className="flex items-center gap-4 px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-lg 
                         hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-150 group"
            >
              {/* Depth indicator */}
              <div className="flex gap-px flex-shrink-0">
                {[...Array(Math.min(page.depth + 1, 4))].map((_, di) => (
                  <div key={di} className="w-0.5 h-4 bg-neutral-700 rounded-full" />
                ))}
              </div>

              {/* Type badge */}
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0 ${getPageTypeColor(page.type)}`}>
                {page.type.replace("_", " ")}
              </span>

              {/* URL */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono text-neutral-300 truncate">{page.url}</div>
                {page.title && (
                  <div className="text-xs text-neutral-600 truncate mt-0.5">{page.title}</div>
                )}
              </div>

              {/* Actions */}
              <a
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-white
                           transition-all duration-150 text-xs flex-shrink-0"
              >
                ↗
              </a>
            </motion.div>
          ))}

          {filtered.length === 0 && pages.length > 0 && (
            <div className="text-center py-12 text-neutral-600 text-sm">
              No pages match your filter
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PagesSkeleton() {
  return (
    <div className="space-y-1">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-lg">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
