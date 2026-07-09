"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItemData {
  label: string;
  url?: string;
  children?: NavItemData[];
}

function NavTree({ items, depth = 0 }: { items: NavItemData[]; depth?: number }) {
  return (
    <div className={depth > 0 ? "ml-6 border-l border-neutral-800 pl-4 mt-1 space-y-1" : "space-y-1"}>
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 py-1.5">
            {depth > 0 && <div className="w-3 h-px bg-neutral-700 flex-shrink-0" />}
            <div className="flex items-center gap-2 flex-1">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-300 hover:text-white font-medium"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-sm text-neutral-300 font-medium">{item.label}</span>
              )}
              {item.url && (
                <span className="text-[10px] text-neutral-600 font-mono truncate max-w-xs">{item.url}</span>
              )}
              {item.children && item.children.length > 0 && (
                <span className="text-[10px] text-neutral-600">▾ {item.children.length}</span>
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
  const isLoading = !navigation && step === "analyzing";

  if (isLoading) return <NavSkeleton />;
  if (!navigation) return <EmptyState />;

  const nav = navigation as { navbar?: NavItemData[]; footer?: NavItemData[]; breadcrumbs?: string[] };

  return (
    <div className="space-y-6">
      {/* Navbar */}
      {nav.navbar && nav.navbar.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="intel-card">
          <div className="section-label mb-4">Navigation Bar ({nav.navbar.length} items)</div>
          <NavTree items={nav.navbar} />
        </motion.div>
      )}

      {/* Footer */}
      {nav.footer && nav.footer.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="intel-card">
          <div className="section-label mb-4">Footer Links ({nav.footer.length} items)</div>
          <NavTree items={nav.footer} />
        </motion.div>
      )}

      {/* Breadcrumbs */}
      {nav.breadcrumbs && nav.breadcrumbs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="intel-card">
          <div className="section-label mb-4">Breadcrumbs</div>
          <div className="flex items-center gap-2 flex-wrap">
            {nav.breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-sm text-neutral-300">{crumb}</span>
                {i < nav.breadcrumbs!.length - 1 && (
                  <span className="text-neutral-600">/</span>
                )}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {!nav.navbar?.length && !nav.footer?.length && (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-600">
          <div className="text-4xl mb-4">⊖</div>
          <p className="text-sm">No navigation structure found</p>
        </div>
      )}
    </div>
  );
}

function NavSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="intel-card space-y-3">
          <Skeleton className="h-3 w-32" />
          {[...Array(5)].map((_, j) => (
            <div key={j} className="flex items-center gap-2 py-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-neutral-600">
      <div className="text-4xl mb-4">⊖</div>
      <p className="text-sm">Navigation data pending...</p>
    </div>
  );
}
