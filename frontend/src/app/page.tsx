"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import HeroInput from "@/components/HeroInput";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import { useAnalysisStore } from "@/store/analysis";
import { crawlApi, analysisApi, screenshotsApi, assetsApi } from "@/lib/api";
import { normalizeUrl, isValidUrl } from "@/lib/utils";

export default function HomePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const store = useAnalysisStore();

  const runAnalysis = useCallback(async () => {
    let url = normalizeUrl(store.url);
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsAnalyzing(true);
    store.reset();
    store.setUrl(url);

    try {
      // ── STEP 1: Start Crawl ────────────────────────────────────────
      store.setStep("crawling");
      store.addLog(`▶ Starting analysis for ${url}`);
      store.addLog("◎ Initiating page discovery...");

      const crawlRes = await crawlApi.start(url, 100);
      const jobId = crawlRes.data.job_id;
      store.setJobId(jobId);
      store.addLog(`✓ Job created: ${jobId}`);

      // Poll crawl status
      await new Promise<void>((resolve) => {
        const poll = setInterval(async () => {
          try {
            const statusRes = await crawlApi.status(jobId);
            const status = statusRes.data;
            store.setProgress(status.progress || 0);
            if (status.logs?.length) {
              store.setLogs(status.logs);
            }
            if (status.pages?.length) {
              store.setPages(status.pages);
            }
            if (status.status === "completed" || status.status === "failed") {
              clearInterval(poll);
              store.setPages(status.pages || []);
              store.addLog(`✓ Discovery complete — ${status.pages_found} pages found`);
              resolve();
            }
          } catch (err) {
            clearInterval(poll);
            resolve();
          }
        }, 1500);
      });

      // ── STEP 2: Full Analysis ──────────────────────────────────────
      store.setStep("analyzing");
      store.setProgress(0);
      store.addLog("◎ Running full website analysis...");

      const analysisRes = await analysisApi.analyze(url, jobId);
      const analysis = analysisRes.data;

      store.setOverview(analysis.overview || {});
      store.setBrand(analysis.brand || {});
      store.setNavigation(analysis.navigation || {});
      store.setSeo(analysis.seo || {});
      store.setTechnologies(analysis.technologies || []);
      store.setSocial(analysis.social_media || {});
      store.setContacts(analysis.contacts || {});
      store.setProgress(100);
      store.addLog("✓ Website analysis complete");

      // ── STEP 3: Screenshots ────────────────────────────────────────
      store.setStep("screenshots");
      store.setProgress(0);
      store.addLog("◎ Capturing screenshots...");
      try {
        const ssRes = await screenshotsApi.capture(url, jobId);
        store.setScreenshots(ssRes.data.screenshots || []);
        store.addLog(`✓ ${ssRes.data.screenshots?.length || 0} screenshots captured`);
      } catch {
        store.addLog("⚠ Screenshot capture failed — continuing");
      }
      store.setProgress(100);

      // ── STEP 4: Asset Extraction ───────────────────────────────────
      store.setStep("assets");
      store.setProgress(0);
      store.addLog("◎ Extracting visual assets...");
      try {
        const assetRes = await assetsApi.extract(url, jobId);
        store.setAssets(assetRes.data.assets || []);
        store.addLog(`✓ ${assetRes.data.total || 0} assets extracted`);
      } catch {
        store.addLog("⚠ Asset extraction failed — continuing");
      }
      store.setProgress(100);

      // Done
      store.setStep("complete");
      store.addLog("✓ Analysis complete — all steps done");
      toast.success("Analysis complete!", { description: `${store.pages.length} pages analyzed` });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      store.addLog(`✗ Error: ${message}`);
      toast.error("Analysis failed", { description: message });
      store.setStep("idle");
    } finally {
      setIsAnalyzing(false);
    }
  }, [store]);

  const hasResults = store.step === "complete" || (store.step !== "idle" && store.pages.length > 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-neutral-900 bg-black/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
              <circle cx="11" cy="11" r="8" stroke="black" strokeWidth="2.5" fill="none"/>
              <path d="m21 21-4.35-4.35" stroke="black" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="11" cy="11" r="3" fill="black"/>
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight">WebIntel</span>
          <span className="text-neutral-600 text-xs font-mono">v1.0</span>
        </div>
        <nav className="flex items-center gap-6 text-xs text-neutral-500">
          <span className="hover:text-white cursor-pointer transition-colors">Docs</span>
          <span className="hover:text-white cursor-pointer transition-colors">API</span>
          <span className="hover:text-white cursor-pointer transition-colors">GitHub</span>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-[73px]">
        <AnimatePresence mode="wait">
          {!hasResults ? (
            <motion.div
              key="hero"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] px-6"
            >
              <HeroInput
                onAnalyze={runAnalysis}
                isAnalyzing={isAnalyzing}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <AnalysisDashboard onNewAnalysis={() => store.reset()} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
