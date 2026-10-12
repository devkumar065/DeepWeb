"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { aiApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Sparkles,
  Cpu,
  Palette,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
  Wand2,
  FileCode2,
  ShieldCheck
} from "lucide-react";

export default function AITab() {
  const { url, scanId, jobId, aiAnalysis, aiRedesign, setAiAnalysis, setAiRedesign } = useAnalysisStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingRedesign, setGeneratingRedesign] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("Minimalist Linear");

  const runAiAnalysis = async () => {
    if (!url) {
      toast.error("No website URL provided");
      return;
    }

    setAnalyzing(true);
    const toastId = toast.loading("Synthesizing AI architectural review...");

    try {
      const store = useAnalysisStore.getState();
      const payload = {
        overview: store.overview,
        technologies: store.technologies,
        seo: store.seo,
        brand: store.brand,
      };

      const res = await aiApi.analyze(url, (scanId || jobId || "default") as string, payload);
      setAiAnalysis(res.data);
      toast.success("AI review generated successfully!", { id: toastId });
    } catch (err: unknown) {
      console.error("AI error:", err);
      toast.error("AI review unavailable. Check backend AI configuration.", { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  };

  const runAiRedesign = async () => {
    if (!url) return;

    setGeneratingRedesign(true);
    const toastId = toast.loading(`Generating ${selectedStyle} redesign proposal...`);

    try {
      const store = useAnalysisStore.getState();
      const payload = {
        brand: store.brand,
        technologies: store.technologies,
      };

      const res = await aiApi.redesign(url, selectedStyle, payload);
      setAiRedesign(res.data);
      toast.success("Redesign proposal generated!", { id: toastId });
    } catch (err: unknown) {
      console.error("AI redesign error:", err);
      toast.error("Redesign proposal unavailable.", { id: toastId });
    } finally {
      setGeneratingRedesign(false);
    }
  };

  const STYLES = ["Minimalist Linear", "Editorial Swiss", "High-Tech Cyber", "Warm Organic"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analysisData = (aiAnalysis as Record<string, any>) || null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const redesignData = (aiRedesign as Record<string, any>) || null;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              DeepWeb Intelligence Engine
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-foreground">
            AI Architectural Audit & Redesign
          </h2>
          <p className="text-xs text-muted max-w-xl">
            Leverage LLM reasoning over the extracted HTML, network security records, and design tokens to audit user experience flaws, code performance bottlenecks, and design modern UI alternatives.
          </p>
        </div>

        <button
          onClick={runAiAnalysis}
          disabled={analyzing}
          className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-xs shadow-sm hover:bg-accent-hover active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Synthesizing...
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5" />
              Run AI Audit
            </>
          )}
        </button>
      </motion.div>

      {/* Analysis Results or Empty Prompt */}
      {analysisData ? (
        <div className="space-y-6">
          {/* Executive Summary */}
          {analysisData.summary && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <Lightbulb className="w-4 h-4 text-accent" />
                Executive Synthesis
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {analysisData.summary}
              </p>
            </motion.div>
          )}

          {/* Key Findings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisData.strengths && (
              <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Architectural Strengths
                </div>
                <ul className="space-y-2 text-xs text-foreground-secondary">
                  {(Array.isArray(analysisData.strengths) ? analysisData.strengths : [analysisData.strengths]).map(
                    (s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-success mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {analysisData.recommendations && (
              <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Optimization Opportunities
                </div>
                <ul className="space-y-2 text-xs text-foreground-secondary">
                  {(Array.isArray(analysisData.recommendations) ? analysisData.recommendations : [analysisData.recommendations]).map(
                    (r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-surface border border-border rounded-xl space-y-2 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">Security Vulnerability Assessment</h4>
            <p className="text-xs text-muted leading-relaxed">
              Synthesizes headers, SSL cipher suites, and DNS configuration to detect misconfigured policies.
            </p>
          </div>

          <div className="p-5 bg-surface border border-border rounded-xl space-y-2 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
              <FileCode2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">Stack Modernization Audit</h4>
            <p className="text-xs text-muted leading-relaxed">
              Evaluates outdated frontend scripts and compares them against current industry best practices.
            </p>
          </div>

          <div className="p-5 bg-surface border border-border rounded-xl space-y-2 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
              <Palette className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">Design Token Harmony Check</h4>
            <p className="text-xs text-muted leading-relaxed">
              Analyzes contrast ratios across extracted color palettes and proposes WCAG-compliant adjustments.
            </p>
          </div>
        </div>
      )}

      {/* Redesign Generator Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="w-4 h-4 text-accent" />
              <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
                Design System Re-imagination
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Generate AI Redesign Concepts
            </h3>
          </div>

          <button
            onClick={runAiRedesign}
            disabled={generatingRedesign}
            className="px-4 py-2 rounded-xl bg-surface border border-border hover:bg-surface-elevated text-foreground font-semibold text-xs transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {generatingRedesign ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />
                Generating Concept...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Generate Redesign
              </>
            )}
          </button>
        </div>

        {/* Style Selection Chips */}
        <div className="flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedStyle === style
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-surface-elevated text-muted hover:text-foreground border border-border"
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Redesign Data View */}
        {redesignData ? (
          <div className="p-4 bg-surface-elevated rounded-xl border border-border space-y-3">
            <div className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Aesthetic Concept: {selectedStyle}</span>
              <span className="text-[10px] text-muted font-mono">Generated via DeepWeb AI</span>
            </div>
            <div className="text-xs text-foreground-secondary leading-relaxed whitespace-pre-wrap">
              {typeof redesignData === "string" ? redesignData : JSON.stringify(redesignData, null, 2)}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted italic">
            Select a design aesthetic above and click Generate Redesign to produce a tailored color palette, font pairing, and component direction.
          </p>
        )}
      </motion.div>
    </div>
  );
}
