"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { exportApi } from "@/lib/api";
import { downloadBlob, formatDomain } from "@/lib/utils";
import { toast } from "sonner";

const EXPORT_FORMATS = [
  {
    id: "json",
    label: "JSON",
    desc: "Full structured data",
    icon: "{ }",
    ext: "json",
  },
  {
    id: "txt",
    label: "Links & Assets (TXT)",
    desc: "Line by line links",
    icon: "≡",
    ext: "txt",
  },
  {
    id: "csv",
    label: "CSV",
    desc: "Spreadsheet format",
    icon: "⊞",
    ext: "csv",
  },
  {
    id: "markdown",
    label: "Markdown",
    desc: "Readable report",
    icon: "#",
    ext: "md",
  },
  {
    id: "html",
    label: "HTML Report",
    desc: "Standalone web report",
    icon: "<>",
    ext: "html",
  },
  {
    id: "zip",
    label: "ZIP Bundle",
    desc: "Everything in one archive",
    icon: "◻",
    ext: "zip",
  },
];

export default function ExportTab() {
  const { url, jobId, overview, brand, navigation, seo, technologies, social, contacts, assets, pages } =
    useAnalysisStore();
  const [loading, setLoading] = useState<string | null>(null);

  const fullData = {
    url,
    overview,
    brand,
    navigation,
    seo,
    technologies,
    social_media: social,
    contacts,
    pages,
    assets,
    assets_summary: {
      total: assets.length,
      types: assets.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {} as Record<string, number>),
    },
    exported_at: new Date().toISOString(),
  };

  const handleExport = async (format: string, ext: string) => {
    setLoading(format);
    try {
      const domain = formatDomain(url);
      const filename = `webintel-${domain}-${jobId?.slice(0, 8) || "export"}.${ext}`;

      let res;
      switch (format) {
        case "json":    res = await exportApi.json(fullData, url, jobId || ""); break;
        case "txt":     res = await exportApi.txt(fullData, url, jobId || ""); break;
        case "csv":     res = await exportApi.csv(fullData, url, jobId || ""); break;
        case "markdown": res = await exportApi.markdown(fullData, url, jobId || ""); break;
        case "html":    res = await exportApi.html(fullData, url, jobId || ""); break;
        case "zip":     res = await exportApi.zip(fullData, url, jobId || ""); break;
        default: return;
      }

      downloadBlob(new Blob([res.data]), filename);
      toast.success(`Exported as ${ext.toUpperCase()}`);
    } catch (e: unknown) {
      toast.error("Export failed", { description: (e as Error).message });
    } finally {
      setLoading(null);
    }
  };

  const dataSize = JSON.stringify(fullData).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="section-label mb-1">Export</div>
        <h2 className="text-2xl font-bold">Download Your Report</h2>
        <p className="text-neutral-500 text-sm mt-1">
          {pages.length} pages · {assets.length} assets · {(dataSize / 1024).toFixed(1)} KB data
        </p>
      </div>

      {/* Format Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_FORMATS.map((fmt, i) => (
          <motion.button
            key={fmt.id}
            id={`export-${fmt.id}-btn`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => handleExport(fmt.id, fmt.ext)}
            disabled={!!loading}
            className="intel-card text-left hover:border-neutral-600 active:scale-98 transition-all duration-150
                       disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center 
                             text-lg font-mono border border-neutral-700 group-hover:border-neutral-500 transition-colors">
                {loading === fmt.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : fmt.icon}
              </div>
              <span className="text-neutral-600 group-hover:text-white transition-colors text-xs">
                {loading === fmt.id ? "Exporting..." : "↓"}
              </span>
            </div>
            <div className="text-base font-semibold">{fmt.label}</div>
            <div className="text-xs text-neutral-500 mt-1">{fmt.desc}</div>
            <div className="mt-3 text-[10px] font-mono text-neutral-700">.{fmt.ext}</div>
          </motion.button>
        ))}
      </div>

      {/* What's Included */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="intel-card"
      >
        <div className="section-label mb-4">What's Included</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Pages", count: pages.length },
            { label: "Technologies", count: Object.keys(technologies).length },
            { label: "Assets", count: assets.length },
            { label: "SEO Fields", count: seo ? Object.keys(seo).length : 0 },
            { label: "Brand Colors", count: (brand as Record<string, unknown[]>)?.colors?.length || 0 },
            { label: "Social Profiles", count: social ? Object.values(social).filter(Boolean).length : 0 },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-3 py-2 bg-neutral-900 rounded-lg">
              <span className="text-xs text-neutral-500">{item.label}</span>
              <span className="text-xs font-bold tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Raw JSON Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="intel-card"
      >
        <div className="section-label mb-3">Data Preview</div>
        <div className="bg-neutral-950 rounded-lg p-4 overflow-auto max-h-72 border border-neutral-800">
          <pre className="text-xs font-mono text-neutral-500 whitespace-pre-wrap">
            {JSON.stringify(
              { url, pages_count: pages.length, assets_count: assets.length, overview },
              null,
              2
            )}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}
