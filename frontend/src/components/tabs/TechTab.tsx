"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import type { Technology } from "@/store/analysis";
import { Cpu, CheckCircle2 } from "lucide-react";

const CATEGORY_ORDER = [
  "framework", "cms", "cdn", "hosting", "analytics", 
  "css_framework", "payment", "database", "security", "other"
];

const CATEGORY_LABELS: Record<string, string> = {
  framework: "Frontend Frameworks & Libraries",
  cms: "Content Management Systems (CMS)",
  cdn: "Content Delivery Network (CDN)",
  hosting: "Hosting & Cloud Infrastructure",
  analytics: "Analytics, Pixels & Telemetry",
  css_framework: "CSS & Design Frameworks",
  payment: "Payment Gateways & Processors",
  database: "Databases & APIs",
  security: "Security & DDoS Protection",
  other: "Other Detected Technologies",
};

export default function TechTab() {
  const { technologies, step } = useAnalysisStore();
  const isLoading = technologies.length === 0 && (step === "analyzing" || step === "fetching" || step === "rendering");

  if (isLoading) return <TechSkeleton />;
  if (technologies.length === 0) return <EmptyState />;

  const grouped = technologies.reduce((acc, tech) => {
    const cat = tech.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tech);
    return acc;
  }, {} as Record<string, Technology[]>);

  const categories = [...CATEGORY_ORDER, ...Object.keys(grouped).filter((k) => !CATEGORY_ORDER.includes(k))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-1">
            Technology Stack Detection
          </div>
          <h2 className="text-2xl font-bold font-serif text-foreground tabular-nums">
            {technologies.length} Technologies Identified
          </h2>
        </div>
      </div>

      {/* Core Infrastructure Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["framework", "cms", "cdn", "hosting"].map((cat) => {
          const tech = grouped[cat]?.[0];
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-border-hover transition-colors"
            >
              <div className="text-[10px] font-mono font-semibold tracking-wider uppercase text-muted mb-2">
                {CATEGORY_LABELS[cat]?.split(" ")[0] || cat}
              </div>
              {tech ? (
                <div>
                  <div className="text-base font-bold font-mono text-foreground truncate">
                    {tech.name}
                  </div>
                  <ConfidenceBar confidence={tech.confidence} />
                </div>
              ) : (
                <div className="text-sm font-mono text-muted">—</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* All Technologies Grouped by Category */}
      <div className="space-y-6">
        {categories.filter((cat) => grouped[cat]?.length).map((cat, catIdx) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.04 }}
            className="bg-surface border border-border rounded-2xl p-6 shadow-xs"
          >
            <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-4 pb-2 border-b border-border flex items-center justify-between">
              <span>{CATEGORY_LABELS[cat] || cat}</span>
              <span className="text-xs text-foreground font-mono">{grouped[cat].length} detected</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(grouped[cat] || []).map((tech, i) => (
                <div
                  key={tech.name}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-surface-elevated border border-border hover:border-border-hover transition-colors"
                >
                  <div className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center text-xs font-mono font-bold text-accent border border-border flex-shrink-0">
                    {tech.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {tech.name}
                      </span>
                      {tech.version && (
                        <span className="text-[10px] text-muted font-mono px-1.5 py-0.2 rounded bg-surface border border-border">
                          v{tech.version}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden border border-border/50">
                        <motion.div
                          className="h-full bg-accent rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${tech.confidence}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        />
                      </div>
                      <span className="text-[10px] text-muted font-mono tabular-nums w-7 text-right">
                        {tech.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 bg-surface-elevated rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted tabular-nums">{confidence}%</span>
    </div>
  );
}

function TechSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className="h-14 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-muted bg-surface border border-border rounded-2xl">
      <div className="text-3xl mb-3 text-accent font-serif font-bold">⊗</div>
      <p className="text-sm font-medium text-foreground">Technology Data Pending</p>
      <p className="text-xs text-muted mt-1">Start a scan to detect software stack</p>
    </div>
  );
}
