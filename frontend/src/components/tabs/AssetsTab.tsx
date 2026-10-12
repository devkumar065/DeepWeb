"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { formatFileSize } from "@/lib/utils";
import { assetsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Asset } from "@/store/analysis";
import { LayoutGrid, List, Download, Search, ExternalLink, FileImage, Copy } from "lucide-react";
import { toast } from "sonner";

const ASSET_TYPES = ["all", "image", "svg", "video", "gif", "lottie", "icon", "illustration"];

export default function AssetsTab() {
  const { assets, step } = useAnalysisStore();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isLoading = assets.length === 0 && (step !== "idle" && step !== "complete");

  const filtered = assets.filter((a) => {
    const matchType = filter === "all" || a.type === filter;
    const matchSearch = !search || 
      a.url.toLowerCase().includes(search.toLowerCase()) ||
      (a.filename || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.alt_text || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const counts = assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const downloadAsset = (a: Asset) => {
    if (a.url === "inline") return;
    window.open(assetsApi.downloadUrl(a.url), "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-1">
            Media & Vector Catalog
          </div>
          <h2 className="text-2xl font-bold font-serif text-foreground tabular-nums">
            {assets.length} Visual Assets Extracted
          </h2>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "grid" 
                ? "bg-accent text-accent-foreground shadow-2xs font-semibold" 
                : "text-muted hover:text-foreground"
            }`}
            aria-label="Grid View"
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "list" 
                ? "bg-accent text-accent-foreground shadow-2xs font-semibold" 
                : "text-muted hover:text-foreground"
            }`}
            aria-label="List View"
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Asset Type Filters */}
      <div className="flex flex-wrap gap-2">
        {ASSET_TYPES.filter((t) => t === "all" || counts[t]).map((type) => {
          const isSelected = filter === type;
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border cursor-pointer ${
                isSelected
                  ? "bg-accent text-accent-foreground border-accent shadow-2xs font-semibold"
                  : "bg-surface text-muted border-border hover:text-foreground hover:border-border-hover"
              }`}
            >
              <span>{type === "all" ? "All Assets" : type}</span>
              <span className={`ml-1.5 text-[10px] ${isSelected ? "text-accent-foreground/80" : "text-muted"}`}>
                {type === "all" ? assets.length : counts[type]}
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
          placeholder="Filter assets by filename, URL, format, or alt text..."
          className="w-full bg-surface border border-border text-foreground text-sm pl-10 pr-4 py-2.5 rounded-xl placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 font-mono transition-all"
        />
      </div>

      {/* Asset Grid or List */}
      {isLoading ? (
        <AssetsSkeleton viewMode={viewMode} />
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl">
          <p className="text-sm font-medium text-foreground">No assets match your filter</p>
          <p className="text-xs text-muted mt-1">Try resetting the search input or selecting a different category.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((asset, i) => (
            <AssetCard key={`${asset.url}-${i}`} asset={asset} onDownload={() => downloadAsset(asset)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((asset, i) => (
            <AssetRow key={`${asset.url}-${i}`} asset={asset} onDownload={() => downloadAsset(asset)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset, onDownload }: { asset: Asset; onDownload: () => void }) {
  const isInline = asset.url === "inline";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs hover:border-border-hover transition-all flex flex-col group"
    >
      {/* Preview Screen */}
      <div className="aspect-video bg-surface-elevated flex items-center justify-center relative overflow-hidden border-b border-border">
        {asset.type === "video" ? (
          <div className="text-muted text-xs font-mono">▶ Video Asset</div>
        ) : asset.type === "lottie" ? (
          <div className="text-muted text-xs font-mono">✦ Lottie JSON</div>
        ) : asset.type === "svg" && isInline ? (
          <div
            className="w-14 h-14 flex items-center justify-center p-2 text-foreground [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
            dangerouslySetInnerHTML={{ __html: asset.inline_content || "" }}
          />
        ) : !isInline ? (
          <img
            src={asset.url}
            alt={asset.alt_text || asset.filename}
            className="w-full h-full object-contain p-2"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) parent.innerHTML = `<span class="text-muted text-xs font-mono">${asset.type.toUpperCase()}</span>`;
            }}
          />
        ) : (
          <span className="text-muted text-xs font-mono">{asset.type.toUpperCase()}</span>
        )}

        {/* Hover overlay with download */}
        {!isInline && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:scale-105 transition-transform"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        )}

        {/* Tag badge */}
        <span className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-surface/90 text-foreground rounded-md border border-border">
          {asset.format || asset.type}
        </span>
      </div>

      {/* Info footer */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-xs font-mono font-medium text-foreground truncate" title={asset.filename}>
            {asset.filename || "asset-file"}
          </div>
          {asset.alt_text && (
            <div className="text-[11px] text-muted truncate mt-0.5">{asset.alt_text}</div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-muted pt-2 border-t border-border">
          <span>{asset.width && asset.height ? `${asset.width}×${asset.height}` : "Vector"}</span>
          <span>{formatFileSize(asset.file_size)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function AssetRow({ asset, onDownload }: { asset: Asset; onDownload: () => void }) {
  const isInline = asset.url === "inline";

  const copyUrl = () => {
    navigator.clipboard?.writeText(asset.url);
    toast.success("Asset URL copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-surface border border-border rounded-xl hover:border-border-hover transition-colors"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 text-muted">
          <FileImage className="w-4 h-4 text-accent" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-mono font-semibold text-foreground truncate max-w-sm">
            {asset.filename || "asset"}
          </div>
          <div className="text-[11px] font-mono text-muted truncate max-w-md">
            {asset.url}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0 text-xs font-mono">
        <span className="px-2 py-0.5 rounded bg-surface-elevated text-muted border border-border text-[10px] uppercase">
          {asset.format || asset.type}
        </span>
        <span className="text-muted tabular-nums">
          {formatFileSize(asset.file_size)}
        </span>
        {!isInline && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={copyUrl}
              className="p-1.5 rounded-lg border border-border bg-surface-elevated text-muted hover:text-foreground transition-colors"
              title="Copy Asset URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDownload}
              className="p-1.5 rounded-lg border border-border bg-surface-elevated text-muted hover:text-foreground transition-colors"
              title="Download Asset"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AssetsSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden p-0">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-3 bg-surface border border-border rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-80" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
