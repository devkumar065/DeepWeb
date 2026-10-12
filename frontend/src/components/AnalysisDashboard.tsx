"use client";

import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { formatDomain } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import PagesTab from "./tabs/PagesTab";
import OverviewTab from "./tabs/OverviewTab";
import BrandTab from "./tabs/BrandTab";
import AssetsTab from "./tabs/AssetsTab";
import ScreenshotsTab from "./tabs/ScreenshotsTab";
import SEOTab from "./tabs/SEOTab";
import TechTab from "./tabs/TechTab";
import SocialTab from "./tabs/SocialTab";
import ReportTab from "./tabs/ReportTab";
import NavigationTab from "./tabs/NavigationTab";
import NetworkSecurityTab from "./tabs/NetworkSecurityTab";

const TABS = [
  { id: "overview", label: "Overview", icon: "◎" },
  { id: "pages", label: "All Pages", icon: "⊞" },
  { id: "brand", label: "Colors & Fonts", icon: "◈" },
  { id: "assets", label: "Images & Assets", icon: "⊡" },
  { id: "screenshots", label: "Screenshots", icon: "⊟" },
  { id: "seo", label: "SEO Health", icon: "⊕" },
  { id: "tech", label: "Tech Stack", icon: "⊗" },
  { id: "network", label: "Network & Security", icon: "⊛" },
  { id: "navigation", label: "Site Menu", icon: "⊖" },
  { id: "social", label: "Social & Contacts", icon: "⊙" },
  { id: "report", label: "Export Report", icon: "📄" },
];

interface Props {
  onNewAnalysis: () => void;
}

export default function AnalysisDashboard({ onNewAnalysis }: Props) {
  const [activeTab, setActiveTab] = useState("overview");
  const { url, pages, step, assets, screenshots, overview } = useAnalysisStore();

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    pages: <PagesTab />,
    brand: <BrandTab />,
    assets: <AssetsTab />,
    screenshots: <ScreenshotsTab />,
    seo: <SEOTab />,
    tech: <TechTab />,
    network: <NetworkSecurityTab />,
    navigation: <NavigationTab />,
    social: <SocialTab />,
    report: <ReportTab />,
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {/* Sticky Dashboard Navigation Shell */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-6 py-3.5">
          {/* Top Bar: Brand, Target, Stats & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            {/* Left: Brand + Target Domain */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2.5 border-r border-border pr-5 flex-shrink-0">
                <Logo className="w-7 h-7" />
                <span className="font-bold text-[17px] font-sans tracking-tight text-foreground hidden sm:inline">
                  DeepWeb
                </span>
              </div>
              
              <div className="flex items-center gap-3 min-w-0">
                {overview && (overview as { favicon?: string }).favicon && (
                  <img
                    src={(overview as { favicon: string }).favicon}
                    alt="favicon"
                    className="w-5 h-5 rounded-md border border-border p-0.5 bg-surface-elevated flex-shrink-0"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm text-foreground truncate flex items-center gap-2">
                    <span>{formatDomain(url)}</span>
                  </h2>
                  <p className="text-[11px] text-muted font-mono truncate max-w-xs sm:max-w-md">{url}</p>
                </div>
              </div>
            </div>

            {/* Right: Scan Stats, Live Status, Theme Toggle, New Scan */}
            <div className="flex items-center gap-3 sm:gap-4 self-end md:self-auto flex-wrap">
              {/* Stat counters */}
              <div className="hidden lg:flex items-center gap-4 border-r border-border pr-4">
                <Stat label="Pages" value={pages.length} />
                <Stat label="Assets" value={assets.length} />
                <Stat label="Screenshots" value={screenshots.filter((s) => !s.error).length} />
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 text-xs font-mono font-medium">
                {step !== "complete" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Scanning...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Complete</span>
                  </span>
                )}
              </div>

              {/* Global Theme Toggle */}
              <ThemeToggle variant="compact" />

              {/* New Scan Button */}
              <button
                id="new-scan-btn"
                onClick={onNewAnalysis}
                className="inline-flex items-center gap-1.5 text-xs text-foreground bg-surface-elevated hover:bg-surface border border-border hover:border-border-hover px-3.5 py-2 rounded-xl transition-all duration-150 font-medium shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>New Scan</span>
              </button>

              {/* GitHub Link */}
              <a
                href="https://github.com/devkumar065/DeepWeb"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-elevated border border-border text-muted hover:text-foreground hover:border-border-hover transition-colors"
                aria-label="GitHub Repository"
                title="GitHub Repository"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom Bar: Tab Navigation Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-border/60">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-accent text-accent-foreground shadow-2xs font-semibold"
                      : "text-muted hover:text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  <span className={`text-[11px] ${isActive ? "opacity-100" : "opacity-60"}`}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === "pages" && pages.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? "bg-accent-foreground/20 text-accent-foreground" : "bg-surface-elevated text-muted"
                    }`}>
                      {pages.length}
                    </span>
                  )}
                  {tab.id === "assets" && assets.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? "bg-accent-foreground/20 text-accent-foreground" : "bg-surface-elevated text-muted"
                    }`}>
                      {assets.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Tab Panels */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center font-mono">
      <div className="text-sm font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}
