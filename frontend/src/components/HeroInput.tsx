"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { normalizeUrl } from "@/lib/utils";

interface HeroInputProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const FEATURE_PILLS = [
  "Page Discovery",
  "Tech Stack",
  "Brand Assets",
  "Screenshots",
  "SEO Analysis",
  "AI Insights",
  "Visual Extraction",
  "Contact Info",
];

const EXAMPLE_URLS = [
  "https://stripe.com",
  "https://linear.app",
  "https://vercel.com",
  "https://supabase.com",
];

export default function HeroInput({ onAnalyze, isAnalyzing }: HeroInputProps) {
  const { url, setUrl } = useAnalysisStore();
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onAnalyze();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-10"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-400 text-xs font-mono">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Production-grade intelligence
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-center text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5"
      >
        Reverse engineer
        <br />
        <span className="text-neutral-500">any website.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center text-neutral-500 text-lg mb-12 max-w-xl mx-auto"
      >
        Discover every page, extract brand assets, detect tech stacks,
        analyze SEO, and get AI-powered insights in seconds.
      </motion.p>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`relative flex gap-3 p-2 rounded-2xl border transition-all duration-200 ${
          focused
            ? "border-neutral-600 bg-neutral-900/80"
            : "border-neutral-800 bg-neutral-950"
        }`}
      >
        {/* URL prefix */}
        <div className="flex items-center pl-3 text-neutral-600 text-sm font-mono flex-shrink-0">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
          </svg>
        </div>

        <input
          id="url-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          disabled={isAnalyzing}
          className="flex-1 bg-transparent text-white text-sm font-mono placeholder:text-neutral-600 focus:outline-none py-3 px-1 disabled:opacity-50"
          autoComplete="off"
          spellCheck={false}
        />

        <button
          id="analyze-btn"
          onClick={onAnalyze}
          disabled={isAnalyzing || !url.trim()}
          className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-6 py-3 rounded-xl
                     hover:bg-neutral-100 active:scale-95 transition-all duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isAnalyzing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing
            </>
          ) : (
            <>
              Analyze
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </motion.div>

      {/* Example URLs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 mt-4 flex-wrap justify-center"
      >
        <span className="text-neutral-600 text-xs">Try:</span>
        {EXAMPLE_URLS.map((u) => (
          <button
            key={u}
            onClick={() => setUrl(u)}
            className="text-xs text-neutral-500 hover:text-white font-mono 
                       px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600
                       transition-all duration-150"
          >
            {u.replace("https://", "")}
          </button>
        ))}
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap justify-center gap-2 mt-14"
      >
        {FEATURE_PILLS.map((pill, i) => (
          <motion.span
            key={pill}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.04 }}
            className="text-xs text-neutral-500 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-950"
          >
            {pill}
          </motion.span>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-10 mt-16"
      >
        {[
          { value: "500+", label: "Pages" },
          { value: "15", label: "Analysis Steps" },
          { value: "2", label: "AI Models" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="text-xs text-neutral-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
