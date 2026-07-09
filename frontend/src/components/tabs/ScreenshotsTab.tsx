"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import type { Screenshot } from "@/store/analysis";

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

  const isLoading = screenshots.length === 0 && step === "screenshots";

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
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label mb-1">Screenshots</div>
          <h2 className="text-2xl font-bold tabular-nums">{screenshots.filter((s) => !s.error).length}</h2>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Capturing...
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "viewport", "fullpage"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f ? "bg-white text-black" : "bg-neutral-900 text-neutral-500 border border-neutral-800 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f === "viewport" ? "Viewport" : "Full Page"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <ScreenshotsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s, i) => (
            <motion.div
              key={s.viewport}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group cursor-pointer"
              onClick={() => setSelected(s)}
            >
              <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 hover:border-neutral-600 transition-colors">
                {/* Browser bar mockup */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800/80 border-b border-neutral-700">
                  <div className="w-2 h-2 rounded-full bg-neutral-600" />
                  <div className="w-2 h-2 rounded-full bg-neutral-600" />
                  <div className="w-2 h-2 rounded-full bg-neutral-600" />
                  <div className="flex-1 mx-3 bg-neutral-700 rounded text-[9px] text-neutral-500 text-center py-0.5">
                    {VIEWPORT_LABELS[s.viewport] || s.viewport}
                  </div>
                </div>

                {/* Screenshot */}
                <div className="relative overflow-hidden max-h-64">
                  <img
                    src={s.data_url!}
                    alt={`Screenshot ${s.viewport}`}
                    className="w-full object-cover object-top"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                      className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-neutral-100"
                    >
                      View Full
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadScreenshot(s); }}
                      className="text-white text-xs border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10"
                    >
                      ↓ Download PNG
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between px-1">
                <span className="text-xs text-neutral-500">{VIEWPORT_LABELS[s.viewport] || s.viewport}</span>
                <span className="text-[10px] text-neutral-600 font-mono">{s.width}×{s.height}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16 text-neutral-600">
          <div className="text-3xl mb-3">⊟</div>
          <p className="text-sm">No screenshots available</p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-6xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-neutral-300">{VIEWPORT_LABELS[selected.viewport]}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadScreenshot(selected)}
                    className="text-xs text-white border border-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-800"
                  >
                    ↓ Download
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-xs text-neutral-500 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="overflow-auto rounded-xl border border-neutral-800">
                <img src={selected.data_url!} alt="Full screenshot" className="w-full" />
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
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-neutral-800">
          <div className="h-8 bg-neutral-800" />
          <Skeleton className="h-48 w-full rounded-none" />
        </div>
      ))}
    </div>
  );
}
