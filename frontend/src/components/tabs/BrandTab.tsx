"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandTab() {
  const { brand, step } = useAnalysisStore();
  const isLoading = !brand && step === "analyzing";

  if (isLoading) return <BrandSkeleton />;
  if (!brand) return <EmptyState />;

  const b = brand as Record<string, unknown>;
  const colors = (b.colors as Array<{hex: string; rgb: string; hsl: string; frequency?: number}>) || [];
  const fonts = (b.fonts as Array<{family: string; weights?: string[]; source?: string}>) || [];
  const logos = (b.logo_urls as string[]) || [];
  const borderRadii = (b.border_radius as string[]) || [];

  return (
    <div className="space-y-8">
      {/* Logo Gallery */}
      {logos.length > 0 && (
        <Section label="Logos">
          <div className="flex flex-wrap gap-4">
            {logos.map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative group"
              >
                <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 w-48 border border-neutral-200">
                  <img src={url} alt={`Logo ${i + 1}`} className="max-h-full max-w-full object-contain"
                    onError={(e) => { (e.currentTarget.parentElement as HTMLElement).remove(); }} />
                </div>
                <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={url} download className="text-xs text-white border border-white/20 px-3 py-1.5 rounded-lg hover:bg-white/10">
                    Download
                  </a>
                </div>
                <div className="mt-1 text-[10px] text-neutral-600 font-mono truncate max-w-[192px]">Light</div>
              </motion.div>
            ))}
            {/* Dark mode version */}
            {logos.map((url, i) => (
              <motion.div
                key={`dark-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (logos.length + i) * 0.05 }}
                className="relative group"
              >
                <div className="bg-neutral-900 rounded-xl p-6 flex items-center justify-center h-24 w-48 border border-neutral-700">
                  <img src={url} alt={`Logo dark ${i + 1}`} className="max-h-full max-w-full object-contain filter invert"
                    onError={(e) => { (e.currentTarget.parentElement as HTMLElement).remove(); }} />
                </div>
                <div className="mt-1 text-[10px] text-neutral-600 font-mono truncate max-w-[192px]">Dark</div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <Section label={`Brand Colors (${colors.length})`}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colors.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="intel-card !p-0 overflow-hidden"
              >
                <div
                  className="h-20 w-full cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: c.hex }}
                  onClick={() => navigator.clipboard?.writeText(c.hex)}
                  title="Click to copy HEX"
                />
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold font-mono">{c.hex.toUpperCase()}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(c.hex)}
                      className="text-[10px] text-neutral-500 hover:text-white transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono leading-4">
                    <div>{c.rgb}</div>
                    <div>{c.hsl}</div>
                  </div>
                  {c.frequency && (
                    <div className="text-[10px] text-neutral-600">
                      Frequency: {c.frequency}×
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Typography */}
      {fonts.length > 0 && (
        <Section label="Typography">
          <div className="space-y-3">
            {fonts.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="intel-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-bold" style={{ fontFamily: f.family }}>
                      {f.family}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">{f.source || "local"}</div>
                  </div>
                  <div className="flex gap-1">
                    {f.weights?.map((w) => (
                      <span key={w} className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-1 rounded">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-neutral-800">
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-1">Regular</div>
                    <div className="text-sm" style={{ fontFamily: f.family, fontWeight: 400 }}>The quick brown fox</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-1">Medium</div>
                    <div className="text-sm" style={{ fontFamily: f.family, fontWeight: 500 }}>The quick brown fox</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-1">Bold</div>
                    <div className="text-sm" style={{ fontFamily: f.family, fontWeight: 700 }}>The quick brown fox</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Design Tokens */}
      {(borderRadii.length > 0) && (
        <Section label="Design Tokens">
          <div className="grid grid-cols-2 gap-4">
            {borderRadii.length > 0 && (
              <div className="intel-card">
                <div className="section-label mb-3">Border Radius</div>
                <div className="space-y-2">
                  {borderRadii.slice(0, 6).map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div
                        className="w-8 h-8 border border-neutral-600 bg-neutral-800"
                        style={{ borderRadius: r }}
                      />
                      <span className="font-mono text-neutral-400">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="section-label mb-4">{label}</div>
      {children}
    </div>
  );
}

function BrandSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-3 w-20 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-24 w-48 rounded-xl" />
          <Skeleton className="h-24 w-48 rounded-xl" />
        </div>
      </div>
      <div>
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="intel-card !p-0 overflow-hidden">
              <Skeleton className="h-20 w-full rounded-none" />
              <div className="p-3 space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-neutral-600">
      <div className="text-4xl mb-4">◈</div>
      <p className="text-sm">Brand data pending...</p>
    </div>
  );
}
