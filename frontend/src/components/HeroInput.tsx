"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { 
  Link2, 
  ArrowRight, 
  Layers, 
  Search, 
  FileText, 
  Palette, 
  Globe, 
  ShieldCheck, 
  Camera, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Compass, 
  Cpu, 
  Image as ImageIcon 
} from "lucide-react";

interface HeroInputProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  totalScans: number | null;
}

const EXAMPLE_URLS = ["stripe.com", "linear.app", "vercel.com", "supabase.com"];

const FEATURE_CARDS = [
  {
    title: "Page Explorer",
    description: "Map the complete site structure with depth, status codes, and type hierarchy.",
    icon: Compass,
  },
  {
    title: "Technology Stack",
    description: "Detect frameworks, UI libraries, CDNs, hosting providers, and CMS with confidence scoring.",
    icon: Cpu,
  },
  {
    title: "Design System & Brand",
    description: "Extract exact brand colors with HEX/RGB/HSL, typography specimens, and logo assets.",
    icon: Palette,
  },
  {
    title: "Visual Assets & Media",
    description: "Catalog all SVGs, webp images, icons, and vector graphics with one-click downloads.",
    icon: ImageIcon,
  },
  {
    title: "Multi-Device Screenshots",
    description: "Capture pixel-perfect viewport and full-page screenshots across desktop, tablet, and mobile.",
    icon: Camera,
  },
  {
    title: "SEO & Social Graph",
    description: "Comprehensive audits of OpenGraph, Twitter Cards, canonical links, and JSON-LD schemas.",
    icon: Search,
  },
  {
    title: "Network & Security",
    description: "Inspect SSL certificates, HSTS, CSP headers, DNS records, and WHOIS registration data.",
    icon: ShieldCheck,
  },
  {
    title: "Contact & Social Discovery",
    description: "Automatically discover verified emails, phone numbers, and linked social media accounts.",
    icon: Users,
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Submit Target URL",
    description: "Enter any public website domain. DeepWeb initiates DNS resolution and SSL handshake verification instantly.",
  },
  {
    step: "02",
    title: "Deep Extraction Engine",
    description: "Our crawler maps pages, analyzes client-side bundles, extracts CSS design tokens, and computes SEO scores.",
  },
  {
    step: "03",
    title: "Actionable Intelligence",
    description: "Explore findings in a structured interactive dashboard, or export technical reports in PDF and raw ZIP formats.",
  },
];

export default function HeroInput({ onAnalyze, isAnalyzing, totalScans }: HeroInputProps) {
  const { url, setUrl } = useAnalysisStore();
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && url.trim()) {
      onAnalyze();
    }
  };

  return (
    <div className="w-full relative overflow-hidden">
      {/* ─── CONCENTRIC CIRCULAR RINGS BACKDROP (Matching Image 1) ─── */}
      <div 
        aria-hidden="true" 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1600px] h-[900px] pointer-events-none flex items-center justify-center opacity-60 dark:opacity-40"
      >
        <svg
          className="w-full h-full text-foreground/5 dark:text-foreground/10"
          viewBox="0 0 1600 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="800" cy="380" r="230" stroke="currentColor" strokeWidth="1" />
          <circle cx="800" cy="380" r="390" stroke="currentColor" strokeWidth="1" />
          <circle cx="800" cy="380" r="550" stroke="currentColor" strokeWidth="1" />
          <circle cx="800" cy="380" r="720" stroke="currentColor" strokeWidth="1" />
          <circle cx="800" cy="380" r="910" stroke="currentColor" strokeWidth="1" />
          <circle cx="800" cy="380" r="1120" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      {/* ─── HERO MAIN SECTION ─── */}
      <section className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col justify-between pt-10 sm:pt-16 pb-0 px-6 sm:px-8 max-w-[1440px] mx-auto text-center">
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full my-auto">
          {/* Top Kicker with flanking lines */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3 sm:gap-4 mb-7 sm:mb-9"
          >
            <div className="w-10 sm:w-16 h-px bg-zinc-300 dark:bg-zinc-700" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase font-semibold text-zinc-600 dark:text-zinc-400">
              INSTANT WEBSITE INTELLIGENCE
            </span>
            <div className="w-10 sm:w-16 h-px bg-zinc-300 dark:bg-zinc-700" />
          </motion.div>

          {/* Editorial Serif Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-5xl sm:text-7xl lg:text-[84px] xl:text-[90px] font-normal tracking-tight text-zinc-950 dark:text-white leading-[1.08] sm:leading-[1.05] max-w-5xl mx-auto"
          >
            <span className="block">Uncover every layer</span>
            <span className="flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap mt-2 sm:mt-3">
              <span>of</span>
              <span className="bg-black text-white dark:bg-white dark:text-black px-3 sm:px-4 py-0 sm:py-0.5 rounded-[4px] inline-block font-serif font-normal">
                the web.
              </span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 sm:mt-8 text-center text-zinc-600 dark:text-zinc-400 text-base sm:text-lg lg:text-[19px] leading-relaxed max-w-xl mx-auto font-sans"
          >
            Explore a website&apos;s structure, technology stack, SEO signals,
            <br className="hidden sm:inline" />
            and visual identity in one clear report.
          </motion.p>

          {/* Search / URL Input Bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-[680px] mx-auto mt-9 sm:mt-11"
          >
            <div
              className={`relative flex items-center p-2 rounded-2xl border bg-white dark:bg-zinc-900 transition-all duration-200 shadow-[0_2px_14px_rgba(0,0,0,0.04)] ${
                focused
                  ? "border-zinc-950 ring-4 ring-zinc-950/5 dark:border-white dark:ring-white/5 shadow-md"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-center pl-3 pr-2 text-zinc-900 dark:text-zinc-100 flex-shrink-0">
                <Link2 className="w-5 h-5 -rotate-45" />
              </div>

              <input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Enter website URL (e.g. https://stripe.com)"
                disabled={isAnalyzing}
                className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 text-sm sm:text-base placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none py-3 px-2 font-sans disabled:opacity-50"
                autoComplete="off"
                spellCheck={false}
              />

              <button
                id="scan-btn"
                onClick={() => {
                  if (!url.trim()) {
                    setUrl("https://stripe.com");
                  }
                  onAnalyze();
                }}
                disabled={isAnalyzing}
                className="flex items-center gap-2 flex-shrink-0 px-5 sm:px-6 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-medium text-sm sm:text-[14px] transition-all cursor-pointer shadow-sm"
                aria-label="Analyze website"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze website</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Quick Target Suggestions: TRY A WEBSITE */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <div className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400 font-semibold mb-3">
              TRY A WEBSITE
            </div>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
              {EXAMPLE_URLS.map((target) => (
                <button
                  key={target}
                  onClick={() => setUrl(`https://${target}`)}
                  className="px-5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-mono text-xs sm:text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                >
                  {target}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ─── BOTTOM FEATURE STRIP (Docked to Hero) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="w-full border-t border-zinc-200 dark:border-zinc-800 mt-14 sm:mt-20"
        >
          <div className="max-w-[1340px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800">
            {/* 1. Technology stack */}
            <div className="flex items-start gap-4 p-6 sm:p-7 lg:p-8">
              <div className="text-zinc-950 dark:text-white flex-shrink-0 pt-0.5">
                <Layers className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[15px] sm:text-base text-zinc-950 dark:text-white leading-snug">
                  Technology stack
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                  Detect frameworks, libraries and tools
                </p>
              </div>
            </div>

            {/* 2. SEO & metadata */}
            <div className="flex items-start gap-4 p-6 sm:p-7 lg:p-8">
              <div className="text-zinc-950 dark:text-white flex-shrink-0 pt-0.5">
                <Search className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[15px] sm:text-base text-zinc-950 dark:text-white leading-snug">
                  SEO & metadata
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                  Analyze meta tags, SEO signals and more
                </p>
              </div>
            </div>

            {/* 3. Pages & structure */}
            <div className="flex items-start gap-4 p-6 sm:p-7 lg:p-8">
              <div className="text-zinc-950 dark:text-white flex-shrink-0 pt-0.5">
                <FileText className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[15px] sm:text-base text-zinc-950 dark:text-white leading-snug">
                  Pages & structure
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                  Explore pages, links and site architecture
                </p>
              </div>
            </div>

            {/* 4. Brand assets */}
            <div className="flex items-start gap-4 p-6 sm:p-7 lg:p-8">
              <div className="text-zinc-950 dark:text-white flex-shrink-0 pt-0.5">
                <Palette className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[15px] sm:text-base text-zinc-950 dark:text-white leading-snug">
                  Brand assets
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                  Extract colors, fonts and visual identity
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS (3-STEP EDITORIAL WORKFLOW) ─── */}
      <section id="how-it-works" className="w-full py-20 px-6 lg:px-12 border-t border-border bg-surface-elevated/40">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-muted">
              Architecture & Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal font-serif text-foreground mt-2 tracking-tight">
              Three steps to complete clarity.
            </h2>
            <p className="text-muted text-sm sm:text-base mt-3">
              Automated high-concurrency website dissection from URL submission to structured reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS_STEPS.map((step, idx) => (
              <div 
                key={step.step}
                className="relative p-8 rounded-2xl border border-border bg-surface shadow-sm hover:border-border-hover transition-all duration-200"
              >
                <div className="text-3xl font-serif text-foreground/80 mb-4">{step.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.description}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-border z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPREHENSIVE FEATURES GRID ─── */}
      <section id="features" className="w-full py-24 px-6 lg:px-12 border-t border-border bg-background">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col items-center text-center mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-muted mb-2">
              Deep Extraction Modules
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal font-serif text-foreground tracking-tight">
              Everything in a single scan.
            </h2>
            <p className="text-muted text-sm sm:text-base mt-3 leading-relaxed">
              No manual inspection, browser DevTools toggling, or multi-extension clutter. DeepWeb delivers deep intelligence across every domain layer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
            {FEATURE_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="p-6 rounded-2xl border border-border bg-surface shadow-sm hover:border-border-hover hover:bg-surface-elevated/50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center mb-5 border border-border text-foreground group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">{card.title}</h3>
                  <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
                    {card.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* ─── LIVE PLATFORM METRICS ─── */}
          <div className="p-8 sm:p-10 rounded-3xl border border-border bg-surface shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left items-center">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-foreground flex-shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold font-serif text-foreground tabular-nums">
                  {totalScans !== null ? totalScans.toLocaleString() : "1,420+"}
                </div>
                <div className="text-xs text-muted font-medium mt-0.5">Scans Completed Successfully</div>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8">
              <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-foreground flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold font-serif text-foreground tabular-nums">~45s</div>
                <div className="text-xs text-muted font-medium mt-0.5">Average Deep Scan Time</div>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8">
              <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-foreground flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold font-serif text-foreground tabular-nums">15+</div>
                <div className="text-xs text-muted font-medium mt-0.5">Intelligence Categories Covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRODUCTION FOOTER ─── */}
      <footer className="w-full border-t border-border bg-surface py-12 px-6 lg:px-12">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted">
          <div className="flex items-center gap-3">
            <span className="font-bold text-foreground font-sans tracking-tight">DeepWeb</span>
            <span>·</span>
            <span>Instant Website Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/devkumar065/DeepWeb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span>GitHub</span>
            </a>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
