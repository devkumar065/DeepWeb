// @ts-nocheck
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { aiApi } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const REDESIGN_STYLES = [
  { id: "apple", label: "Apple Style", desc: "Clean, minimal, premium" },
  { id: "stripe", label: "Stripe Style", desc: "Bold typography, purple gradient" },
  { id: "linear", label: "Linear Style", desc: "Dark, geometric, sharp" },
];

export default function AITab() {
  const { aiAnalysis, aiRedesign, setAiAnalysis, setAiRedesign, url, overview, seo, technologies, pages } = useAnalysisStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRedesigning, setIsRedesigning] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("apple");

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysisData = { overview, seo, technologies, pages };
      const res = await aiApi.analyze(url, "current", analysisData);
      setAiAnalysis(res.data);
      toast.success("AI analysis complete");
    } catch (e: unknown) {
      toast.error("AI analysis failed", { description: (e as Error).message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runRedesign = async () => {
    setIsRedesigning(true);
    try {
      const analysisData = { overview, seo, technologies, pages };
      const res = await aiApi.redesign(url, selectedStyle, analysisData);
      setAiRedesign(res.data);
      toast.success("Redesign generated");
    } catch (e: unknown) {
      toast.error("Redesign failed", { description: (e as Error).message });
    } finally {
      setIsRedesigning(false);
    }
  };

  const ai = aiAnalysis as Record<string, unknown> | null;
  const rd = aiRedesign as Record<string, unknown> | null;

  return (
    <div className="space-y-8">
      {/* AI Analysis Section */}
      <div>
        <div className="section-label mb-4">AI Intelligence Analysis</div>
        {!ai ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="intel-card text-center py-12"
          >
            <div className="text-4xl mb-4">✦</div>
            <h3 className="text-lg font-semibold mb-2">Gemini AI Analysis</h3>
            <p className="text-neutral-500 text-sm mb-6 max-w-md mx-auto">
              Run a deep AI analysis to understand the business type, target audience,
              strengths, weaknesses, and get actionable suggestions.
            </p>
            <button
              id="run-ai-analysis-btn"
              onClick={runAIAnalysis}
              disabled={isAnalyzing}
              className="bg-white text-black font-semibold text-sm px-8 py-3 rounded-xl
                         hover:bg-neutral-100 active:scale-95 transition-all duration-150
                         disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Analyzing with Gemini...
                </>
              ) : (
                <>✦ Run AI Analysis</>
              )}
            </button>
          </motion.div>
        ) : (
          <AIAnalysisResults data={ai} onRerun={runAIAnalysis} isRunning={isAnalyzing} />
        )}
      </div>

      {/* AI Redesign Section */}
      <div>
        <div className="section-label mb-4">AI Redesign Generator</div>
        <div className="intel-card">
          <h3 className="text-base font-semibold mb-2">Generate a Modern Redesign</h3>
          <p className="text-neutral-500 text-sm mb-5">
            AI will generate Tailwind + React components for your website redesign.
          </p>

          {/* Style selector */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {REDESIGN_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                  selectedStyle === style.id
                    ? "bg-white text-black border-white"
                    : "border-neutral-700 hover:border-neutral-500 text-neutral-300"
                }`}
              >
                <div className="text-sm font-semibold">{style.label}</div>
                <div className={`text-xs mt-0.5 ${selectedStyle === style.id ? "text-black/60" : "text-neutral-500"}`}>
                  {style.desc}
                </div>
              </button>
            ))}
          </div>

          <button
            id="run-redesign-btn"
            onClick={runRedesign}
            disabled={isRedesigning}
            className="bg-white text-black font-semibold text-sm px-6 py-3 rounded-xl
                       hover:bg-neutral-100 active:scale-95 transition-all duration-150
                       disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isRedesigning ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Generating...
              </>
            ) : (
              "✦ Generate Redesign"
            )}
          </button>
        </div>

        {/* Redesign results */}
        {rd && <RedesignResults data={rd} />}
      </div>
    </div>
  );
}

function AIAnalysisResults({ data, onRerun, isRunning }: {
  data: Record<string, unknown>;
  onRerun: () => void;
  isRunning: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Score */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="intel-card">
        <div className="flex items-center justify-between mb-3">
          <div className="section-label">Overall Score</div>
          <button onClick={onRerun} disabled={isRunning} className="text-xs text-neutral-500 hover:text-white">
            {isRunning ? "Re-running..." : "↺ Re-run"}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-black tabular-nums">{data.overall_score as number ?? "—"}</div>
          <div className="flex-1">
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.overall_score as number ?? 0}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="text-xs text-neutral-500 mt-2">{data.business_type as string}</p>
          </div>
        </div>
      </motion.div>

      {/* Target Audience */}
      {data.target_audience && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="intel-card">
          <div className="section-label mb-2">Target Audience</div>
          <p className="text-sm text-neutral-300">{data.target_audience as string}</p>
        </motion.div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-4">
        <AIList label="Strengths" items={data.strengths as string[]} symbol="+" />
        <AIList label="Weaknesses" items={data.weaknesses as string[]} symbol="−" />
      </div>

      {/* Issues */}
      <div className="grid grid-cols-2 gap-4">
        <AIList label="SEO Issues" items={data.seo_issues as string[]} symbol="!" />
        <AIList label="Missing Pages" items={data.missing_pages as string[]} symbol="?" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AIList label="Accessibility Issues" items={data.accessibility_issues as string[]} symbol="!" />
        <AIList label="Performance Issues" items={data.performance_issues as string[]} symbol="!" />
      </div>

      {/* Suggestions */}
      {(data.suggestions as string[])?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="intel-card">
          <div className="section-label mb-3">Actionable Suggestions</div>
          <div className="space-y-2">
            {(data.suggestions as string[]).map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                <span className="text-neutral-600 flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Redesign suggestions */}
      {data.redesign_suggestions && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="intel-card">
          <div className="section-label mb-3">Redesign Recommendations</div>
          <p className="text-sm text-neutral-300 leading-relaxed">{data.redesign_suggestions as string}</p>
        </motion.div>
      )}
    </div>
  );
}

function AIList({ label, items, symbol }: { label: string; items?: string[]; symbol: string }) {
  if (!items?.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="intel-card">
      <div className="section-label mb-3">{label}</div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-neutral-400">
            <span className="text-neutral-600 flex-shrink-0 font-mono">{symbol}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RedesignResults({ data }: { data: Record<string, unknown> }) {
  const [tab, setTab] = useState<"concept" | "code" | "tokens">("concept");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="intel-card mt-4"
    >
      <div className="flex items-center gap-3 mb-4">
        {(["concept", "code", "tokens"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${
              tab === t ? "bg-white text-black" : "text-neutral-500 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "concept" && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-300">{data.design_concept as string}</p>
          {data.color_palette && (
            <div>
              <div className="section-label mb-2">Suggested Color Palette</div>
              <div className="flex gap-2">
                {Object.entries(data.color_palette as Record<string, string>).map(([name, hex]) => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-md border border-neutral-700" style={{ backgroundColor: hex }} />
                    <span className="text-[9px] text-neutral-600 capitalize">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.page_structure && (
            <div>
              <div className="section-label mb-2">Recommended Structure</div>
              <div className="flex flex-wrap gap-2">
                {(data.page_structure as string[]).map((s, i) => (
                  <span key={i} className="text-xs bg-neutral-800 text-neutral-300 px-3 py-1 rounded">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "code" && data.hero_component && (
        <div className="bg-neutral-950 rounded-lg p-4 overflow-auto max-h-96">
          <pre className="text-xs font-mono text-neutral-400 whitespace-pre-wrap">
            {data.hero_component as string}
          </pre>
        </div>
      )}

      {tab === "tokens" && data.design_tokens && (
        <div className="bg-neutral-950 rounded-lg p-4 overflow-auto max-h-96">
          <pre className="text-xs font-mono text-neutral-400 whitespace-pre-wrap">
            {JSON.stringify(data.design_tokens, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  );
}
