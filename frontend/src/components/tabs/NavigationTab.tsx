"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, CornerDownRight, Menu, Compass } from "lucide-react";

interface NavItemData {
  label: string;
  url?: string;
  children?: NavItemData[];
}

function NavTree({ items, depth = 0 }: { items: NavItemData[]; depth?: number }) {
  return (
    <div className={depth > 0 ? "ml-5 pl-4 border-l border-border mt-1.5 space-y-1.5" : "space-y-1.5"}>
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 py-1.5 group">
            {depth > 0 && <CornerDownRight className="w-3.5 h-3.5 text-muted/60 flex-shrink-0" />}
            
            <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-foreground hover:text-accent font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>{item.label}</span>
                  <ExternalLink className="w-3 h-3 text-muted group-hover:text-accent transition-colors" />
                </a>
              ) : (
                <span className="text-xs sm:text-sm text-foreground font-medium">{item.label}</span>
              )}

              {item.url && (
                <span className="text-[11px] text-muted font-mono truncate max-w-xs px-2 py-0.5 rounded bg-surface-elevated border border-border/60">
                  {item.url}
                </span>
              )}

              {item.children && item.children.length > 0 && (
                <span className="text-[10px] font-mono font-semibold text-accent px-1.5 py-0.2 rounded bg-accent/10 border border-accent/20">
                  {item.children.length} sub-items
                </span>
              )}
            </div>
          </div>

          {item.children && item.children.length > 0 && (
            <NavTree items={item.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function NavigationTab() {
  const { navigation, step } = useAnalysisStore();
  const isLoading = !navigation && (step === "analyzing" || step === "fetching" || step === "rendering");

  if (isLoading) return <NavSkeleton />;
  if (!navigation) return <EmptyState />;

  const nav = navigation as { navbar?: NavItemData[]; footer?: NavItemData[]; breadcrumbs?: string[] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-1">
          Information Architecture
        </div>
        <h2 className="text-2xl font-bold font-serif text-foreground">
          Navigation Hierarchy & Menus
        </h2>
      </div>

      {/* Primary Navbar */}
      {nav.navbar && nav.navbar.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-xs"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Menu className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground">
                Primary Header Menu ({nav.navbar.length} Root Nodes)
              </h3>
            </div>
          </div>
          <NavTree items={nav.navbar} />
        </motion.div>
      )}

      {/* Footer Navigation */}
      {nav.footer && nav.footer.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-xs"
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-mono font-semibold tracking-wider uppercase text-foreground">
                Footer Sitemap Links ({nav.footer.length} Nodes)
              </h3>
            </div>
          </div>
          <NavTree items={nav.footer} />
        </motion.div>
      )}

      {/* Breadcrumb Trail */}
      {nav.breadcrumbs && nav.breadcrumbs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border border-border rounded-2xl p-6 shadow-xs"
        >
          <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-muted mb-3">
            Breadcrumb Trail
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {nav.breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-foreground font-medium px-2 py-1 rounded bg-surface-elevated border border-border">{crumb}</span>
                {i < nav.breadcrumbs!.length - 1 && (
                  <span className="text-muted">/</span>
                )}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {!nav.navbar?.length && !nav.footer?.length && (
        <EmptyState />
      )}
    </div>
  );
}

function NavSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <Skeleton className="h-4 w-40" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-80 ml-6" />
            <Skeleton className="h-4 w-72 ml-6" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-muted bg-surface border border-border rounded-2xl">
      <div className="text-3xl mb-3 text-accent font-serif font-bold">⊖</div>
      <p className="text-sm font-medium text-foreground">No Navigation Hierarchy Detected</p>
      <p className="text-xs text-muted mt-1">Target website does not expose standard structured navigation links</p>
    </div>
  );
}
