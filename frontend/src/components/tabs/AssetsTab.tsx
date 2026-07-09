"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { formatFileSize } from "@/lib/utils";
import { assetsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Asset } from "@/store/analysis";

const ASSET_TYPES = ["all", "image", "svg", "video", "gif", "lottie", "icon", "illustration"];

export default function AssetsTab() {
  const { assets, step } = useAnalysisStore();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isLoading = assets.length === 0 && step === "assets";

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
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label mb-1">Visual Assets</div>
          <h2 className="text-2xl font-bold tabular-nums">{assets.length}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
          >
            <GridIcon />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {ASSET_TYPES.filter((t) => t === "all" || counts[t]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150 ${
              filter === type
                ? "bg-white text-black"
                : "bg-neutral-900 text-neutral-500 hover:text-white border border-neutral-800"
            }`}
          >
            {type} <span className={filter === type ? "text-black/60" : "text-neutral-600"}>{type === "all" ? assets.length : counts[type]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by filename, URL, or alt text..."
        className="w-full bg-neutral-900 border border-neutral-800 text-white text-sm px-4 py-2.5 rounded-lg 
                   placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 font-mono"
      />

      {/* Asset Grid */}
      {isLoading ? (
        <AssetsSkeleton viewMode={viewMode} />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((asset, i) => (
            <AssetCard key={`${asset.url}-${i}`} asset={asset} onDownload={() => downloadAsset(asset)} />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((asset, i) => (
            <AssetRow key={`${asset.url}-${i}`} asset={asset} onDownload={() => downloadAsset(asset)} />
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16 text-neutral-600">
          <div className="text-3xl mb-3">⊡</div>
          <p className="text-sm">No assets match your filter</p>
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset, onDownload }: { asset: Asset; onDownload: () => void }) {
  const isInline = asset.url === "inline";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="intel-card !p-0 overflow-hidden group cursor-pointer"
    >
      {/* Preview */}
      <div className="aspect-video bg-neutral-800 flex items-center justify-center relative overflow-hidden border-b border-neutral-700">
        {asset.type === "video" ? (
          <div className="text-neutral-500 text-xs">▶ Video</div>
        ) : asset.type === "lottie" ? (
          <div className="text-neutral-500 text-xs">✦ Lottie</div>
        ) : asset.type === "svg" && isInline ? (
          <div
            className="w-12 h-12 text-white"
            dangerouslySetInnerHTML={{ __html: (asset.inline_content || "").slice(0, 500) }}
          />
        ) : !isInline ? (
          <img
            src={asset.url}
            alt={asset.alt_text || asset.filename}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) parent.innerHTML = `<span class="text-neutral-500 text-xs">${asset.type.toUpperCase()}</span>`;
            }}
          />
        ) : (
          <span className="text-neutral-500 text-xs">{asset.type.toUpperCase()}</span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {!isInline && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-neutral-100"
            >
              ↓ Download
            </button>
          )}
        </div>

        {/* Category badge */}
        {asset.category && (
          <span className="absolute top-2 left-2 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-black/70 text-neutral-300 rounded">
            {asset.category}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="text-xs font-mono text-neutral-300 truncate">{asset.filename}</div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-neutral-600">
            {asset.width && asset.height ? `${asset.width}×${asset.height}` : ""}
          </span>
          <span className="text-[10px] text-neutral-600">{formatFileSize(asset.file_size)}</span>
        </div>
        {asset.alt_text && (
          <div className="text-[10px] text-neutral-600 truncate mt-1">{asset.alt_text}</div>
        )}
        <div className="mt-2">
          <span className="intel-tag">{asset.format || asset.type}</span>
        </div>
      </div>
    </motion.div>
  );
}

function AssetRow({ asset, onDownload }: { asset: Asset; onDownload: () => void }) {
  const isInline = asset.url === "inline";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-lg hover:border-neutral-700 transition-all group"
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 bg-neutral-800 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
        {!isInline && asset.type === "image" ? (
          <img src={asset.url} alt="" className="w-full h-full object-cover" loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <span className="text-neutral-500 text-[10px]">{asset.type.slice(0, 3).toUpperCase()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-mono text-neutral-300 truncate">{asset.filename}</div>
        <div className="text-[10px] text-neutral-600 truncate">{isInline ? "Inline" : asset.url}</div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0 text-xs text-neutral-500">
        {asset.width && asset.height && <span className="font-mono">{asset.width}×{asset.height}</span>}
        <span>{formatFileSize(asset.file_size)}</span>
        <span className="intel-tag">{asset.format || asset.type}</span>
        {!isInline && (
          <button onClick={onDownload} className="opacity-0 group-hover:opacity-100 text-white hover:underline transition-opacity">
            ↓
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AssetsSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  return viewMode === "grid" ? (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="intel-card !p-0 overflow-hidden">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="space-y-1">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 bg-neutral-950 border border-neutral-900 rounded-lg">
          <Skeleton className="w-10 h-10 rounded-md flex-shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="0" y="0" width="6" height="6" rx="1"/>
      <rect x="10" y="0" width="6" height="6" rx="1"/>
      <rect x="0" y="10" width="6" height="6" rx="1"/>
      <rect x="10" y="10" width="6" height="6" rx="1"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="0" y="1" width="16" height="2" rx="1"/>
      <rect x="0" y="7" width="16" height="2" rx="1"/>
      <rect x="0" y="13" width="16" height="2" rx="1"/>
    </svg>
  );
}
