"use client";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { toast } from "sonner";
import HeroInput from "@/components/HeroInput";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import FlipTimer from "@/components/FlipTimer";
import { useAnalysisStore, AnalysisStep } from "@/store/analysis";
import { crawlApi, analysisApi, screenshotsApi, assetsApi, statsApi, scanApi } from "@/lib/api";
import { normalizeUrl, isValidUrl } from "@/lib/utils";

export default function HomePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [totalScans, setTotalScans] = useState<number | null>(null);
  const store = useAnalysisStore();

  // Fetch real scan count from the database on page load
  useEffect(() => {
    statsApi.get()
      .then((res) => setTotalScans(res.data.total_scans ?? 0))
      .catch(() => setTotalScans(null));
  }, []);

  const mainRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll({ container: mainRef });
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setIsScrolled(latest > 20);
  });

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
      // ── Start Unified Scan ──────────────────────────────────────
      store.setStep("fetching");
      store.addLog("▶ Starting unified scan...");

      const scanRes = await scanApi.start(url, 20);
      const scanId = scanRes.data.scan_id;
      store.setJobId(scanId);
      store.setScanId(scanId);
      store.addLog("✓ Scan started");

      // ── Connect to SSE Stream for Real-Time Progress ───────────
      const streamUrl = scanApi.streamUrl(scanId);
      
      await new Promise<void>((resolve, reject) => {
        const eventSource = new EventSource(streamUrl);
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Update phase/step
            if (data.phase) {
              store.setStep(data.phase as AnalysisStep);
            }
            
            // Update progress
            if (data.progress !== undefined) {
              store.setProgress(data.progress);
            }
            
            // Update logs
            if (data.logs?.length) {
              store.setLogs(data.logs);
            }
            
            // Update pages count
            if (data.pages_found) {
              // Pages will be populated from final results
            }
          } catch (e) {
            // Ignore parse errors on keepalive messages
          }
        };
        
        // Handle the "complete" event with full results
        eventSource.addEventListener("complete", (event: MessageEvent) => {
          try {
            const results = JSON.parse(event.data);
            
            // Populate all store data from unified results
            if (results.overview) store.setOverview(results.overview);
            if (results.brand) store.setBrand(results.brand);
            if (results.navigation) store.setNavigation(results.navigation);
            if (results.seo) store.setSeo(results.seo);
            if (results.technologies) store.setTechnologies(results.technologies);
            if (results.social_media) store.setSocial(results.social_media);
            if (results.contacts) store.setContacts(results.contacts);
            if (results.pages) store.setPages(results.pages);
            if (results.assets) store.setAssets(results.assets);
            if (results.screenshots) store.setScreenshots(results.screenshots);
            if (results.ai_analysis) store.setAiAnalysis(results.ai_analysis);
            
            store.setStep("complete");
            store.setProgress(100);
            
            if (results.status === "failed") {
              store.addLog(`✗ Scan failed: ${results.error || "Unknown error"}`);
              toast.error("Scan failed", { description: results.error });
            } else {
              store.addLog("✓ All done! Your report is ready.");
              toast.success("Scan complete!", { 
                description: `${results.pages?.length || 0} pages scanned` 
              });
            }
          } catch (e) {
            console.error("Failed to parse complete event:", e);
          }
          
          eventSource.close();
          resolve();
        });
        
        eventSource.onerror = (error) => {
          console.error("SSE error:", error);
          eventSource.close();
          
          // Fallback: poll for results
          (async () => {
            try {
              // Wait a moment then fetch results via polling
              await new Promise(r => setTimeout(r, 2000));
              const pollResult = await scanApi.results(scanId);
              const results = pollResult.data;
              
              if (results.status === "completed") {
                if (results.overview) store.setOverview(results.overview);
                if (results.brand) store.setBrand(results.brand);
                if (results.navigation) store.setNavigation(results.navigation);
                if (results.seo) store.setSeo(results.seo);
                if (results.technologies) store.setTechnologies(results.technologies);
                if (results.social_media) store.setSocial(results.social_media);
                if (results.contacts) store.setContacts(results.contacts);
                if (results.pages) store.setPages(results.pages);
                if (results.assets) store.setAssets(results.assets);
                if (results.screenshots) store.setScreenshots(results.screenshots);
                if (results.ai_analysis) store.setAiAnalysis(results.ai_analysis);
                store.setStep("complete");
                store.setProgress(100);
                toast.success("Scan complete!");
              } else {
                // Keep polling
                const poll = setInterval(async () => {
                  try {
                    const res = await scanApi.results(scanId);
                    if (res.data.status === "completed" || res.data.status === "failed") {
                      clearInterval(poll);
                      const r = res.data;
                      if (r.overview) store.setOverview(r.overview);
                      if (r.brand) store.setBrand(r.brand);
                      if (r.navigation) store.setNavigation(r.navigation);
                      if (r.seo) store.setSeo(r.seo);
                      if (r.technologies) store.setTechnologies(r.technologies);
                      if (r.social_media) store.setSocial(r.social_media);
                      if (r.contacts) store.setContacts(r.contacts);
                      if (r.pages) store.setPages(r.pages);
                      if (r.assets) store.setAssets(r.assets);
                      if (r.screenshots) store.setScreenshots(r.screenshots);
                      if (r.ai_analysis) store.setAiAnalysis(r.ai_analysis);
                      store.setStep("complete");
                      store.setProgress(100);
                      if (r.status === "completed") toast.success("Scan complete!");
                      else toast.error("Scan failed");
                      resolve();
                    }
                  } catch (e) {
                    clearInterval(poll);
                    resolve();
                  }
                }, 3000);
              }
            } catch (e) {
              resolve();
            }
          })();
        };
      });

      // Refresh scan count from DB after completing
      statsApi.get()
        .then((res) => setTotalScans(res.data.total_scans ?? 0))
        .catch(() => {});

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Scan failed";
      store.addLog(`✗ Error: ${message}`);
      toast.error("Scan failed", { description: message });
      store.setStep("idle");
    } finally {
      setIsAnalyzing(false);
    }
  }, [store]);

  const hasResults = store.step === "complete";

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Clean Header matching Image 1 */}
      {!hasResults && (
        <header
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-5 max-w-[1440px] mx-auto bg-background/80 backdrop-blur-md transition-colors"
        >
          <div className="flex items-center gap-3">
            <Logo className="w-6 h-6 text-foreground" />
            <span className="font-bold text-[19px] tracking-tight font-sans text-foreground">
              DeepWeb
            </span>
          </div>

          {/* Right side: Features, How it works, Sample report, Divider, Theme toggle */}
          <nav className="flex items-center gap-6 sm:gap-8">
            <a
              href="#features"
              className="text-[13px] sm:text-[14px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-[13px] sm:text-[14px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <button
              onClick={() => {
                store.setUrl("https://stripe.com");
                runAnalysis();
              }}
              className="text-[13px] sm:text-[14px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors cursor-pointer"
            >
              Sample report
            </button>

            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />

            <a
              href="https://github.com/devkumar065/DeepWeb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors p-1"
              aria-label="GitHub Repository"
              title="GitHub Repository"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>

            <ThemeToggle variant="compact" />
          </nav>
        </header>
      )}

      {/* Main Content */}
      <main ref={mainRef} className={`h-screen overflow-y-auto overflow-x-hidden w-full ${!hasResults ? "pt-[73px]" : ""}`}>
        <AnimatePresence mode="wait">
          {!hasResults ? (
            <motion.div
              key="hero"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[calc(100vh-73px)] w-full"
            >
              {isAnalyzing || (store.step !== "idle" && store.step !== "complete") ? (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] px-6 w-full pb-20">
                  <FlipTimer onCancel={() => {
                    store.reset();
                    setIsAnalyzing(false);
                  }} />
                </div>
              ) : (
                <HeroInput
                  onAnalyze={runAnalysis}
                  isAnalyzing={isAnalyzing}
                  totalScans={totalScans}
                />
              )}
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
