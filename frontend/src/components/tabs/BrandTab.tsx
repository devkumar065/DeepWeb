"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Download, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BrandTab() {
  const { brand, step } = useAnalysisStore();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const isLoading = !brand && (step === "analyzing" || step === "fetching" || step === "rendering");

  if (isLoading) return <BrandSkeleton />;
  if (!brand) return <EmptyState />;

  const b = brand as Record<string, unknown>;
  const colors = (b.colors as Array<{hex: string; rgb: string; hsl: string; frequency?: number}>) || [];
  const fonts = (b.fonts as Array<{family: string; weights?: string[]; source?: string}>) || [];
  const logos = (b.logo_urls as string[]) || [];
  const borderRadii = (b.border_radius as string[]) || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedHex(text);
    toast.success(`Copied ${text.toUpperCase()} to clipboard`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Logos Gallery */}
      {logos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted">
              Brand Logos & Wordmarks ({logos.length})
            </h3>
            <span className="text-xs text-muted font-mono">Rendered on light & dark surfaces</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {logos.map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs hover:border-border-hover transition-colors"
              >
                {/* Side-by-side surface test */}
                <div className="grid grid-cols-2 gap-2 h-28">
                  {/* Light surface */}
                  <div className="rounded-xl bg-[#FFFFFF] border border-[#E5E0E1] p-3 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Logo ${i + 1} Light`} 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} 
                    />
                    <span className="absolute bottom-1 right-2 text-[9px] font-mono font-semibold text-neutral-400">Light</span>
                  </div>

                  {/* Dark surface */}
                  <div className="rounded-xl bg-[#0B0B0D] border border-[#302A2D] p-3 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Logo ${i + 1} Dark`} 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} 
                    />
                    <span className="absolute bottom-1 right-2 text-[9px] font-mono font-semibold text-neutral-500">Dark</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono text-muted truncate max-w-[160px]">
                    Logo asset #{i + 1}
                  </span>
                  <a
                    href={url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono font-medium text-accent hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Brand Color System */}
      {colors.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted">
              Color Tokens ({colors.length})
            </h3>
            <span className="text-xs text-muted font-mono">Click to copy values</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {colors.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="bg-surface border border-border rounded-xl p-3 shadow-xs hover:border-border-hover transition-all flex flex-col gap-2.5 group"
              >
                <div
                  className="h-16 w-full rounded-lg border border-border/80 shadow-2xs cursor-pointer group-hover:scale-[1.02] transition-transform"
                  style={{ backgroundColor: c.hex }}
                  onClick={() => copyToClipboard(c.hex)}
                  title="Click to copy HEX"
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => copyToClipboard(c.hex)}
                      className="font-mono text-xs font-bold text-foreground hover:text-accent transition-colors flex items-center gap-1"
                    >
                      <span>{c.hex.toUpperCase()}</span>
                      {copiedHex === c.hex ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                    {c.frequency && (
                      <span className="text-[10px] font-mono text-muted">{c.frequency}×</span>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-muted truncate">
                    {c.rgb}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Typography Specimens */}
      {fonts.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted">
            Typography System
          </h3>

          <div className="space-y-3">
            {fonts.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                  <div>
                    <h4 className="text-xl font-bold text-foreground" style={{ fontFamily: f.family }}>
                      {f.family}
                    </h4>
                    <span className="text-xs text-muted font-mono">{f.source || "System / Webfont"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {f.weights?.map((w) => (
                      <span key={w} className="text-xs font-mono px-2 py-0.5 rounded bg-surface-elevated text-foreground border border-border">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-muted">Regular 400</span>
                    <p className="text-base text-foreground" style={{ fontFamily: f.family, fontWeight: 400 }}>
                      Sphinx of black quartz, judge my vow.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-muted">Medium 500</span>
                    <p className="text-base text-foreground" style={{ fontFamily: f.family, fontWeight: 500 }}>
                      Sphinx of black quartz, judge my vow.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-muted">Bold 700</span>
                    <p className="text-base text-foreground" style={{ fontFamily: f.family, fontWeight: 700 }}>
                      Sphinx of black quartz, judge my vow.
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Design Tokens & Radii */}
      {borderRadii.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted">
            Border Radius Scales
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {borderRadii.slice(0, 8).map((r, i) => (
              <div 
                key={i} 
                className="bg-surface border border-border rounded-xl p-4 flex flex-col items-center gap-3 text-center"
              >
                <div
                  className="w-12 h-12 border-2 border-accent/40 bg-surface-elevated shadow-2xs"
                  style={{ borderRadius: r }}
                />
                <span className="text-xs font-mono font-bold text-foreground">{r}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BrandSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 h-36">
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-3 h-28">
            <Skeleton className="w-full h-14 rounded-lg mb-2" />
            <Skeleton className="w-16 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-muted bg-surface border border-border rounded-2xl">
      <div className="text-3xl mb-3 text-accent font-serif font-bold">◈</div>
      <p className="text-sm font-medium text-foreground">Brand Assets Pending</p>
      <p className="text-xs text-muted mt-1">Start a scan to extract design tokens and logos</p>
    </div>
  );
}
