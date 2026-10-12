"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Clock } from "lucide-react";

const STEPS = [
  { id: "fetching", label: "Resolving & Fetching" },
  { id: "rendering", label: "Rendering & Crawling" },
  { id: "ai_analysis", label: "Extracting Intelligence" },
  { id: "complete", label: "Scan Complete" },
];

const TOTAL_SCAN_TIME = 45;

export default function CrawlProgress() {
  const { step, progress, logs, pages } = useAnalysisStore();
  const logRef = useRef<HTMLDivElement>(null);

  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SCAN_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const isActive = step !== "idle" && step !== "complete";

    if (isActive && !startedRef.current) {
      startedRef.current = true;
      setSecondsLeft(TOTAL_SCAN_TIME);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }

    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      startedRef.current = false;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  if (step === "idle" || step === "complete") return null;

  const timerPercent = ((TOTAL_SCAN_TIME - secondsLeft) / TOTAL_SCAN_TIME) * 100;
  const isOverdue = secondsLeft === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 w-96 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-elevated/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-foreground">
            {STEPS[currentStepIdx]?.label || "Scanning..."}
          </span>
        </div>
        {/* Countdown timer */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-mono font-bold">
            {Math.round(progress)}%
          </span>
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-semibold border ${
              isOverdue
                ? "bg-surface text-muted border-border"
                : secondsLeft <= 10
                ? "bg-accent/10 text-accent border-accent/20"
                : "bg-surface text-foreground-secondary border-border"
            }`}
          >
            <Clock className="w-3 h-3 opacity-70" />
            <span>{isOverdue ? "Finalizing..." : `~${secondsLeft}s`}</span>
          </div>
        </div>
      </div>

      {/* Timer progress bar */}
      <div className="h-0.5 bg-surface-elevated">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1 px-5 py-3 border-b border-border bg-surface">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i < currentStepIdx
                  ? "bg-success"
                  : i === currentStepIdx
                  ? "bg-accent animate-pulse"
                  : "bg-border"
              }`}
            />
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px ${i < currentStepIdx ? "bg-success/50" : "bg-border"}`} />
            )}
          </div>
        ))}
        <span className="ml-auto text-[10px] text-muted font-mono">
          Step {Math.min(currentStepIdx + 1, STEPS.length)}/{STEPS.length}
        </span>
      </div>

      {/* Pages found badge */}
      {pages.length > 0 && (
        <div className="px-5 py-2 border-b border-border bg-surface-elevated/30 flex items-center justify-between text-xs">
          <span className="text-muted">Pages Discovered</span>
          <span className="font-mono font-semibold text-foreground">{pages.length}</span>
        </div>
      )}

      {/* Live Logs */}
      <div
        ref={logRef}
        className="h-32 overflow-y-auto px-5 py-3 space-y-1 bg-surface font-mono text-[11px]"
      >
        {logs.slice(-30).map((log, i) => (
          <div
            key={i}
            className={`leading-relaxed truncate ${
              log.startsWith("✓")
                ? "text-success font-medium"
                : log.startsWith("✗")
                ? "text-error font-medium"
                : log.startsWith("▶")
                ? "text-accent font-medium"
                : "text-muted"
            }`}
          >
            {log}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
