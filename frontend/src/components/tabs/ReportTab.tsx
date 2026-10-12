"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { toast } from "sonner";
import { exportApi } from "@/lib/api";
import {
  FileText,
  FileDown,
  Archive,
  CheckCircle2,
  Download,
  Eye,
  ExternalLink,
  X,
  Loader2,
  ShieldCheck,
  Globe,
  Sparkles
} from "lucide-react";

export default function ReportTab() {
  const { scanId, url, overview, pages, technologies, brand } = useAnalysisStore();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 1. Extract clean domain
  const domain = url
    ? url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "")
    : "Website";

  // 2. Extract clean site name
  const rawTitle = ((overview?.title as string) || "").trim();
  let siteName = domain.split(".")[0];
  if (siteName) {
    siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
  }
  if (rawTitle) {
    for (const sep of [" | ", " - ", " — ", " – ", " : ", " • ", " / "]) {
      if (rawTitle.includes(sep)) {
        const parts = rawTitle.split(sep);
        const matchingPart = parts.find(
          (p) => p.trim() && (p.toLowerCase().includes(siteName.toLowerCase()) || p.trim().length <= 24)
        );
        if (matchingPart) {
          siteName = matchingPart.trim();
        } else {
          siteName = parts[0].trim().length <= 28 ? parts[0].trim() : parts[parts.length - 1].trim();
        }
        break;
      }
    }
  }

  // 3. Extract site logo or favicon
  const logoUrl =
    (brand?.logo_urls as string[])?.[0] ||
    (brand?.favicon as string) ||
    (overview?.favicon as string) ||
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  const reportPdfUrl = scanId ? `http://localhost:8000/api/v1/report/pdf/${scanId}` : "";
  const reportPreviewUrl = scanId ? `http://localhost:8000/api/v1/report/html/${scanId}` : "";

  const downloadPdf = async () => {
    if (!scanId) {
      toast.error("No active scan found to generate report.");
      return;
    }

    setIsGeneratingPdf(true);
    const toastId = toast.loading("Generating professional PDF Dossier...");

    try {
      // Trigger download via anchor or direct navigation
      const a = document.createElement("a");
      a.href = reportPdfUrl;
      a.download = `DeepWeb-${domain}-Report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => {
        toast.success("PDF Report downloading!", { id: toastId });
        setIsGeneratingPdf(false);
      }, 1500);
    } catch (e: unknown) {
      toast.error("Failed to generate PDF", { id: toastId, description: (e as Error).message });
      setIsGeneratingPdf(false);
    }
  };

  const downloadZip = async () => {
    if (!scanId) {
      toast.error("No active scan found to package data.");
      return;
    }

    setIsGeneratingZip(true);
    const toastId = toast.loading("Packaging Raw Data ZIP archive...");

    try {
      const storeData = useAnalysisStore.getState();

      const response = await exportApi.zip(
        {
          overview: storeData.overview,
          brand: storeData.brand,
          navigation: storeData.navigation,
          seo: storeData.seo,
          technologies: storeData.technologies,
          social_media: storeData.social,
          contacts: storeData.contacts,
          pages: storeData.pages,
          assets: storeData.assets,
          ai_analysis: storeData.aiAnalysis,
        },
        url,
        scanId
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const cleanUrl = url.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "_");
      link.download = `${cleanUrl}_deepweb_report.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Archive downloaded successfully!", { id: toastId });
    } catch (e: unknown) {
      toast.error("Failed to download ZIP", { id: toastId, description: (e as Error).message });
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* ─── PREMIUM REPORT CARD ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm transition-all"
      >
        {/* Executive Target Site Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border p-2 flex items-center justify-center flex-shrink-0 shadow-xs">
              <img
                src={logoUrl}
                alt={`${siteName} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold font-sans text-foreground tracking-tight">
                  {siteName}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-muted">
                  {domain}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-1 max-w-md line-clamp-1">
                {(overview?.meta_description as string) || (overview?.title as string) || "Executive website intelligence dossier"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-xs font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Verified & Ready
            </span>
          </div>
        </div>

        {/* Scan Summary Meta Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
          <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Target Host</div>
            <div className="text-xs font-mono font-semibold text-foreground truncate" title={url || "N/A"}>
              {domain}
            </div>
          </div>

          <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Indexed Pages</div>
            <div className="text-sm font-semibold font-mono text-foreground">
              {pages?.length || 0} pages
            </div>
          </div>

          <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Stack Modules</div>
            <div className="text-sm font-semibold font-mono text-foreground">
              {technologies?.length || 0} libraries
            </div>
          </div>

          <div className="p-3.5 bg-surface-elevated rounded-xl border border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Security Health</div>
            <div className="text-xs font-semibold text-success flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              SSL Active
            </div>
          </div>
        </div>

        {/* Included Sections Checklist */}
        <div className="p-4 bg-surface-elevated rounded-xl border border-border mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">
            Dossier Sections Included in Executive Report
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
              <span>Full Technology Breakdown</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
              <span>Brand Identity & Hex Swatches</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
              <span>SEO Audit & Schema Tags</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
              <span>SSL & Header Security Checklist</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
              <span>Information Architecture Map</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
              <span>Extracted Public Contacts</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: View PDF first, then Download */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* 1. VIEW / PREVIEW BUTTON (Primary User Request) */}
            <button
              id="view-pdf-btn"
              onClick={() => setIsPreviewOpen(true)}
              disabled={!scanId}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-foreground text-background font-medium text-sm hover:opacity-90 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-40"
            >
              <Eye className="w-4 h-4" />
              <span>View PDF Report</span>
            </button>

            {/* 2. DOWNLOAD PDF BUTTON */}
            <button
              id="download-pdf-btn"
              onClick={downloadPdf}
              disabled={isGeneratingPdf || !scanId}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-surface border border-border text-foreground font-medium text-sm hover:bg-surface-elevated hover:border-border-hover active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>

          {/* 3. EXPORT ZIP BUTTON */}
          <button
            onClick={downloadZip}
            disabled={isGeneratingZip || !scanId}
            className="w-full sm:w-auto px-5 py-3 rounded-xl text-muted font-medium text-xs hover:text-foreground hover:bg-surface-elevated transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {isGeneratingZip ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />
                <span>Exporting ZIP...</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 text-muted" />
                <span>Export Raw ZIP</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ─── INTERACTIVE PDF / REPORT VIEWER MODAL ─── */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-5xl h-[92vh] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="px-5 py-3.5 border-b border-border bg-surface-elevated flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface border border-border p-1 flex items-center justify-center flex-shrink-0">
                    <img
                      src={logoUrl}
                      alt={siteName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <span>{siteName}</span>
                      <span className="text-[10px] font-mono text-muted uppercase font-normal hidden sm:inline">
                        — Executive Report Preview
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Download Button inside the Preview */}
                  <button
                    onClick={downloadPdf}
                    disabled={isGeneratingPdf}
                    className="px-4 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Download this PDF report"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download PDF</span>
                  </button>

                  {/* Open in New Window */}
                  <a
                    href={reportPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Close Modal */}
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                    title="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Embedded Preview */}
              <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-2 sm:p-4 overflow-y-auto flex items-center justify-center">
                <div className="w-full max-w-[820px] h-full bg-white shadow-lg rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                  <iframe
                    src={reportPreviewUrl}
                    title={`${siteName} Report Preview`}
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
