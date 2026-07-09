"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import type { Technology } from "@/store/analysis";

const CATEGORY_ORDER = ["framework", "cms", "cdn", "hosting", "analytics", "css_framework", "payment", "database", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  framework: "Frontend Framework",
  cms: "CMS",
  cdn: "CDN",
  hosting: "Hosting",
  analytics: "Analytics & Tracking",
  css_framework: "CSS Framework",
  payment: "Payment",
  database: "Database",
  other: "Other",
};

export default function TechTab() {
  const { technologies, step } = useAnalysisStore();
  const isLoading = technologies.length === 0 && step === "analyzing";

  if (isLoading) return <TechSkeleton />;
  if (technologies.length === 0) return <EmptyState />;

  // Group by category
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
      <div>
        <div className="section-label mb-1">Technology Stack</div>
        <h2 className="text-2xl font-bold tabular-nums">{technologies.length} detected</h2>
      </div>

      {/* Stack overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["framework", "cms", "cdn", "hosting"].map((cat) => {
          const tech = grouped[cat]?.[0];
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="stat-card"
            >
              <div className="section-label mb-2">{CATEGORY_LABELS[cat] || cat}</div>
              {tech ? (
                <>
                  <div className="text-base font-semibold">{tech.name}</div>
                  <ConfidenceBar confidence={tech.confidence} />
                </>
              ) : (
                <div className="text-base text-neutral-700">—</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* All technologies by category */}
      {categories.filter((cat) => grouped[cat]).map((cat, catIdx) => (
        <motion.div
          key={cat}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIdx * 0.05 }}
          className="intel-card"
        >
          <div className="section-label mb-4">{CATEGORY_LABELS[cat] || cat}</div>
          <div className="space-y-3">
            {(grouped[cat] || []).map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: catIdx * 0.05 + i * 0.03 }}
                className="flex items-center gap-4"
              >
                {/* Tech icon placeholder */}
                <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-sm flex-shrink-0 border border-neutral-700">
                  {tech.name.slice(0, 2)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-medium">{tech.name}</span>
                    {tech.version && (
                      <span className="text-[10px] text-neutral-600 font-mono">v{tech.version}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-0.5 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${tech.confidence}%` }}
                        transition={{ duration: 0.8, delay: catIdx * 0.05 + i * 0.03 + 0.2 }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 tabular-nums w-8 text-right">{tech.confidence}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-0.5 bg-neutral-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <span className="text-[10px] text-neutral-500">{confidence}%</span>
    </div>
  );
}

function TechSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-0.5 w-full" />
          </div>
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="intel-card space-y-3">
          <Skeleton className="h-3 w-28" />
          {[...Array(3)].map((_, j) => (
            <div key={j} className="flex items-center gap-4">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-0.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-neutral-600">
      <div className="text-4xl mb-4">⊗</div>
      <p className="text-sm">Technology detection pending...</p>
    </div>
  );
}
