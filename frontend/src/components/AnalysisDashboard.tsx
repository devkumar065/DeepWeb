"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { formatDomain } from "@/lib/utils";
import CrawlProgress from "./CrawlProgress";
import PagesTab from "./tabs/PagesTab";
import OverviewTab from "./tabs/OverviewTab";
import BrandTab from "./tabs/BrandTab";
import AssetsTab from "./tabs/AssetsTab";
import ScreenshotsTab from "./tabs/ScreenshotsTab";
import SEOTab from "./tabs/SEOTab";
import TechTab from "./tabs/TechTab";
import SocialTab from "./tabs/SocialTab";
import AITab from "./tabs/AITab";
import ExportTab from "./tabs/ExportTab";
import NavigationTab from "./tabs/NavigationTab";

const TABS = [
  { id: "overview", label: "Overview", icon: "◎" },
  { id: "pages", label: "Pages", icon: "⊞" },
  { id: "brand", label: "Brand", icon: "◈" },
  { id: "assets", label: "Assets", icon: "⊡" },
  { id: "screenshots", label: "Screenshots", icon: "⊟" },
  { id: "seo", label: "SEO", icon: "⊕" },
  { id: "tech", label: "Technology", icon: "⊗" },
  { id: "navigation", label: "Navigation", icon: "⊖" },
  { id: "social", label: "Social & Contacts", icon: "⊙" },
  { id: "ai", label: "AI Analysis", icon: "✦" },
  { id: "export", label: "Export", icon: "⊘" },
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
    navigation: <NavigationTab />,
    social: <SocialTab />,
    ai: <AITab />,
    export: <ExportTab />,
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Dashboard Header */}
      <div className="border-b border-neutral-900 bg-black/95 sticky top-[73px] z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {overview && (overview as {favicon?: string}).favicon && (
                <img
                  src={(overview as {favicon: string}).favicon}
                  alt="favicon"
                  className="w-5 h-5 rounded"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <div>
                <h2 className="font-semibold text-sm">{formatDomain(url)}</h2>
                <p className="text-xs text-neutral-500 font-mono mt-0.5 truncate max-w-xs">{url}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Stats */}
              <div className="flex items-center gap-4 mr-4">
                <Stat label="Pages" value={pages.length} />
                <Stat label="Assets" value={assets.length} />
                <Stat label="Screenshots" value={screenshots.filter((s) => !s.error).length} />
              </div>
              {/* Status */}
              {step !== "complete" && (
                <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Running
                </span>
              )}
              {step === "complete" && (
                <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full" />
                  Complete
                </span>
              )}
              <button
                id="new-analysis-btn"
                onClick={onNewAnalysis}
                className="text-xs text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 
                           px-3 py-1.5 rounded-lg transition-all duration-150"
              >
                ← New
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap
                           transition-all duration-150 flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-white text-black"
                    : "text-neutral-500 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <span className="text-[10px] opacity-70">{tab.icon}</span>
                {tab.label}
                {tab.id === "pages" && pages.length > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    activeTab === "pages" ? "bg-black/20 text-black" : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {pages.length}
                  </span>
                )}
                {tab.id === "assets" && assets.length > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    activeTab === "assets" ? "bg-black/20 text-black" : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {assets.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating progress panel */}
      <CrawlProgress />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-base font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-neutral-600">{label}</div>
    </div>
  );
}
