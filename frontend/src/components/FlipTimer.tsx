"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Loader2, Terminal, Globe } from "lucide-react";

export default function FlipTimer({ onCancel }: { onCancel: () => void }) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const { url, step, progress, logs } = useAnalysisStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  
  const minStr = minutes.toString().padStart(2, "0");
  const secStr = seconds.toString().padStart(2, "0");

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : "Initializing deep website scan...";

  const getStepLabel = () => {
    switch (step) {
      case "fetching":
        return "Resolving DNS & Network Handshake";
      case "crawling":
      case "rendering":
        return "Rendering DOM & Discovering Pages";
      case "analyzing":
      case "assets":
        return "Extracting Tech Stack & Visual Assets";
      case "ai":
      case "ai_analysis":
        return "Synthesizing SEO & Architecture Insights";
      default:
        return "Deep Website Analysis in Progress";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full max-w-2xl mx-auto px-6 py-12 gap-8 text-center">
      {/* Target URL indicator */}
      {url && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-elevated border border-border text-xs font-mono text-foreground shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-accent" />
          <span className="truncate max-w-xs">{url}</span>
        </motion.div>
      )}

      {/* Flip Clock Display */}
      <div className="flex items-center gap-3 sm:gap-4 text-6xl sm:text-8xl md:text-9xl font-mono font-bold text-foreground tracking-tight select-none">
        <FlipDigit digit={minStr[0]} />
        <FlipDigit digit={minStr[1]} />
        <span className="text-muted pb-3 sm:pb-4 animate-pulse">:</span>
        <FlipDigit digit={secStr[0]} />
        <FlipDigit digit={secStr[1]} />
      </div>

      {/* Progress & Stage Section */}
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="flex items-center gap-2 text-foreground font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            {getStepLabel()}
          </span>
          <span className="text-muted font-bold tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-surface-elevated border border-border overflow-hidden p-0.5">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(progress, 5)}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Live Terminal Log Ticker */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-elevated border border-border text-left font-mono text-[11px] text-muted overflow-hidden">
          <Terminal className="w-3.5 h-3.5 flex-shrink-0 text-accent opacity-80" />
          <span className="truncate flex-1 text-foreground-secondary">{latestLog}</span>
        </div>
      </div>

      {/* Cancel Action */}
      <div className="pt-2">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-full border border-border text-muted hover:text-error hover:border-error/40 hover:bg-error/5 transition-all text-xs font-mono tracking-wider uppercase font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
        >
          Cancel Scan
        </button>
      </div>
    </div>
  );
}

function FlipDigit({ digit }: { digit: string }) {
  return (
    <div className="relative w-18 h-26 sm:w-24 sm:h-34 md:w-30 md:h-42 bg-surface rounded-2xl flex items-center justify-center overflow-hidden border border-border shadow-md">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
      {/* Subtly embossed center crease */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-border/80 z-10" />
    </div>
  );
}
