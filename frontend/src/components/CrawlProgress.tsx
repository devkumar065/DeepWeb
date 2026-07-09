"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";

const STEPS = [
  { id: "crawling", label: "Page Discovery" },
  { id: "analyzing", label: "Full Analysis" },
  { id: "screenshots", label: "Screenshots" },
  { id: "assets", label: "Asset Extraction" },
  { id: "complete", label: "Complete" },
];

export default function CrawlProgress() {
  const { step, progress, logs, pages } = useAnalysisStore();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  if (step === "idle" || step === "complete") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 w-96 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-semibold">
            {STEPS[currentStepIdx]?.label || "Processing"}
          </span>
        </div>
        <span className="text-xs text-neutral-500 font-mono">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-neutral-800">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1 px-5 py-3 border-b border-neutral-800/50">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i < currentStepIdx
                  ? "bg-neutral-500"
                  : i === currentStepIdx
                  ? "bg-white animate-pulse"
                  : "bg-neutral-700"
              }`}
            />
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px ${i < currentStepIdx ? "bg-neutral-600" : "bg-neutral-800"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Stats */}
      {pages.length > 0 && (
        <div className="px-5 py-2 border-b border-neutral-800/50">
          <span className="text-xs text-neutral-500">
            <span className="text-white font-semibold">{pages.length}</span> pages found
          </span>
        </div>
      )}

      {/* Logs */}
      <div
        ref={logRef}
        className="h-40 overflow-y-auto px-5 py-3 space-y-0.5"
      >
        {logs.slice(-30).map((log, i) => (
          <div
            key={i}
            className={`text-xs font-mono leading-5 ${
              log.startsWith("✓")
                ? "text-neutral-300"
                : log.startsWith("✗") || log.startsWith("⚠")
                ? "text-neutral-500"
                : "text-neutral-500"
            }`}
          >
            {log}
          </div>
        ))}
        {(step as string) !== "idle" && (
          <div className="text-xs font-mono text-neutral-600 terminal-cursor">&nbsp;</div>
        )}
      </div>
    </motion.div>
  );
}
