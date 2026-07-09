// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";

const PLATFORMS: Array<{ key: string; label: string; icon: string }> = [
  { key: "instagram", label: "Instagram", icon: "◎" },
  { key: "linkedin", label: "LinkedIn", icon: "◉" },
  { key: "twitter", label: "X / Twitter", icon: "✕" },
  { key: "facebook", label: "Facebook", icon: "◈" },
  { key: "youtube", label: "YouTube", icon: "▶" },
  { key: "github", label: "GitHub", icon: "◆" },
  { key: "discord", label: "Discord", icon: "◇" },
  { key: "tiktok", label: "TikTok", icon: "◊" },
  { key: "pinterest", label: "Pinterest", icon: "●" },
  { key: "threads", label: "Threads", icon: "∞" },
];

export default function SocialTab() {
  const { social, contacts, step } = useAnalysisStore();
  const isLoading = !social && !contacts && step === "analyzing";

  if (isLoading) return <SocialSkeleton />;

  const s = social as Record<string, string | null> | null;
  const c = contacts as Record<string, unknown> | null;

  const foundPlatforms = PLATFORMS.filter((p) => s?.[p.key]);

  return (
    <div className="space-y-8">
      {/* Social Media */}
      <div>
        <div className="section-label mb-4">Social Media Profiles</div>
        {foundPlatforms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {foundPlatforms.map((p, i) => (
              <motion.a
                key={p.key}
                href={s![p.key] || "#"}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="intel-card flex items-center gap-4 hover:border-neutral-600 cursor-pointer group no-underline"
              >
                <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border border-neutral-700">
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-neutral-500 font-mono truncate mt-0.5">
                    {s![p.key]}
                  </div>
                </div>
                <span className="text-neutral-600 group-hover:text-white text-xs transition-colors flex-shrink-0">↗</span>
              </motion.a>
            ))}
          </div>
        ) : (
          <div className="intel-card text-center py-8 text-neutral-600">
            <div className="text-2xl mb-2">⊙</div>
            <p className="text-sm">No social media profiles found</p>
          </div>
        )}
      </div>

      {/* Contacts */}
      {c && (
        <div>
          <div className="section-label mb-4">Contact Information</div>
          <div className="space-y-3">
            {/* Emails */}
            {(c.emails as string[])?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="intel-card">
                <div className="text-xs text-neutral-500 mb-3">Email Addresses</div>
                <div className="space-y-2">
                  {(c.emails as string[]).map((email, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-neutral-500 text-sm">@</span>
                      <a href={`mailto:${email}`} className="text-sm font-mono text-neutral-200 hover:text-white">
                        {email}
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Phones */}
            {(c.phones as string[])?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="intel-card">
                <div className="text-xs text-neutral-500 mb-3">Phone Numbers</div>
                <div className="space-y-2">
                  {(c.phones as string[]).map((phone, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-neutral-500 text-sm">#</span>
                      <a href={`tel:${phone}`} className="text-sm font-mono text-neutral-200 hover:text-white">
                        {phone}
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Address */}
            {c.address && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="intel-card">
                <div className="text-xs text-neutral-500 mb-2">Address</div>
                <p className="text-sm text-neutral-200">{c.address as string}</p>
              </motion.div>
            )}

            {/* Special Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {c.calendly_url && (
                <motion.a
                  href={c.calendly_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="intel-card text-center py-4 hover:border-neutral-600 cursor-pointer"
                >
                  <div className="text-lg mb-1">📅</div>
                  <div className="text-sm font-medium">Calendly</div>
                  <div className="text-xs text-neutral-500 mt-1">Schedule a meeting</div>
                </motion.a>
              )}
              {c.whatsapp_url && (
                <motion.a
                  href={c.whatsapp_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="intel-card text-center py-4 hover:border-neutral-600 cursor-pointer"
                >
                  <div className="text-lg mb-1">💬</div>
                  <div className="text-sm font-medium">WhatsApp</div>
                  <div className="text-xs text-neutral-500 mt-1">Chat directly</div>
                </motion.a>
              )}
              {c.google_maps_url && (
                <motion.a
                  href={c.google_maps_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="intel-card text-center py-4 hover:border-neutral-600 cursor-pointer"
                >
                  <div className="text-lg mb-1">📍</div>
                  <div className="text-sm font-medium">Google Maps</div>
                  <div className="text-xs text-neutral-500 mt-1">View location</div>
                </motion.a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="intel-card flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
