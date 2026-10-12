"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import type { Screenshot } from "@/store/analysis";
import { Download, Maximize2, X, ExternalLink } from "lucide-react";

const VIEWPORT_LABELS: Record<string, string> = {
  desktop: "Desktop 1920×1080",
  desktop_fullpage: "Desktop Full Page",
  laptop: "Laptop 1440×900",
  laptop_fullpage: "Laptop Full Page",
  tablet: "Tablet 768×1024",
  tablet_fullpage: "Tablet Full Page",
  mobile: "Mobile 390×844",
  mobile_fullpage: "Mobile Full Page",
};

export default function ScreenshotsTab() {
  const { screenshots, step } = useAnalysisStore();
  const [selected, setSelected] = useState<Screenshot | null>(null);
  const [filter, setFilter] = useState<"all" | "viewport" | "fullpage">("all");

  const isLoading = screenshots.length === 0 && (step !== "idle" && step !== "complete");

  const filtered = screenshots.filter((s) => {
    if (filter === "viewport") return !s.full_page;
    if (filter === "fullpage") return s.full_page;
    return true;
  }).filter((s) => !s.error && s.data_url);

  const downloadScreenshot = (s: Screenshot) => {
    if (!s.data_url) return;
    const a = document.createElement("a");
    a.href = s.data_url;
    a.download = `screenshot-${s.viewport}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-1">
            Visual Snapshots
          </div>
          <h2 className="text-2xl font-bold font-serif text-foreground tabular-nums">
            {screenshots.filter((s) => !s.error).length} Captured Viewports
          </h2>
        </div>

        {/* Viewport Filter Tabs */}
        <div className="flex gap-2">
          {(["all", "viewport", "fullpage"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border cursor-pointer ${
                filter === f
                  ? "bg-accent text-accent-foreground border-accent shadow-2xs font-semibold"
                  : "bg-surface text-muted border-border hover:text-foreground hover:border-border-hover"
              }`}
            >
              {f === "all" ? "All Frames" : f === "viewport" ? "Fold / Viewport" : "Full Page"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Screenshots */}
      {isLoading ? (
        <ScreenshotsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl">
          <p className="text-sm font-medium text-foreground">No screenshots captured yet</p>
          <p className="text-xs text-muted mt-1">Start a scan to capture automated device renderings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s, i) => (
            <motion.div
              key={`${s.viewport}-${s.url || ''}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group flex flex-col rounded-2xl border border-border bg-surface overflow-hidden shadow-xs hover:border-border-hover transition-all"
            >
              {/* Browser mockup header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-elevated border-b border-border">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-error/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
                </div>
                <div className="flex-1 mx-2 bg-surface rounded px-2 py-0.5 text-[10px] font-mono text-muted text-center truncate border border-border/60">
                  {s.url ? s.url.replace(/https?:\/\//, "") : (VIEWPORT_LABELS[s.viewport] || s.viewport)}
                </div>
              </div>

              {/* Screenshot Image Preview Container */}
              <div 
                className="relative overflow-hidden max-h-72 cursor-pointer bg-surface-elevated/40"
                onClick={() => setSelected(s)}
              >
                <img
                  src={s.data_url!}
                  alt={`Screenshot ${s.viewport}`}
                  className="w-full object-cover object-top"
                  loading="lazy"
                />

                {/* Hover overlay with action buttons */}
                <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground text-xs font-medium shadow-sm hover:scale-105 transition-transform"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadScreenshot(s); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:scale-105 transition-transform"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-border bg-surface text-xs font-mono text-muted">
                <span className="font-medium text-foreground">{VIEWPORT_LABELS[s.viewport] || s.viewport}</span>
                <span className="text-[11px] tabular-nums">{s.width}×{s.height}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Fullscreen Modal View */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated">
                <div className="min-w-0 pr-4">
                  <h4 className="font-semibold text-sm text-foreground truncate">
                    {VIEWPORT_LABELS[selected.viewport] || selected.viewport}
                  </h4>
                  <p className="text-xs font-mono text-muted truncate">{selected.url || "Root viewport snapshot"}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => downloadScreenshot(selected)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-2xs hover:bg-accent/90 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
                    aria-label="Close Preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Image Area */}
              <div className="overflow-y-auto p-4 flex justify-center bg-surface-elevated/40">
                <img 
                  src={selected.data_url!} 
                  alt="Full resolution preview" 
                  className="rounded-xl border border-border shadow-sm max-w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScreenshotsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-border bg-surface p-0">
          <div className="h-9 bg-surface-elevated border-b border-border" />
          <Skeleton className="h-56 w-full rounded-none" />
        </div>
      ))}
    </div>
  );
}
