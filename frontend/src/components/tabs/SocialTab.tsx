// @ts-nocheck
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysis";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Copy,
  Check,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageCircle,
  Share2,
  Globe
} from "lucide-react";
import { toast } from "sonner";

interface SocialPlatform {
  key: string;
  label: string;
  color: string;
  badge: string;
}

const PLATFORMS: SocialPlatform[] = [
  { key: "instagram", label: "Instagram", color: "#E1306C", badge: "IG" },
  { key: "linkedin", label: "LinkedIn", color: "#0A66C2", badge: "IN" },
  { key: "twitter", label: "X / Twitter", color: "#000000", badge: "X" },
  { key: "facebook", label: "Facebook", color: "#1877F2", badge: "FB" },
  { key: "youtube", label: "YouTube", color: "#FF0000", badge: "YT" },
  { key: "github", label: "GitHub", color: "#24292F", badge: "GH" },
  { key: "discord", label: "Discord", color: "#5865F2", badge: "DC" },
  { key: "tiktok", label: "TikTok", color: "#000000", badge: "TT" },
  { key: "pinterest", label: "Pinterest", color: "#BD081C", badge: "PIN" },
  { key: "threads", label: "Threads", color: "#000000", badge: "TH" },
];

export default function SocialTab() {
  const { social, contacts, step } = useAnalysisStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isLoading = !social && !contacts && step === "analyzing";
  if (isLoading) return <SocialSkeleton />;

  const s = social as Record<string, string | null> | null;
  const c = contacts as Record<string, unknown> | null;

  const foundPlatforms = PLATFORMS.filter((p) => s?.[p.key]);

  const copyToClipboard = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Social Media Profiles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              Connected Social Profiles
            </span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-foreground-secondary">
            {foundPlatforms.length} Detected
          </span>
        </div>

        {foundPlatforms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {foundPlatforms.map((p, i) => (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative bg-surface border border-border rounded-xl p-4 shadow-sm hover:border-border-hover hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center font-mono font-bold text-xs tracking-wider text-foreground group-hover:border-accent/40 group-hover:text-accent transition-colors">
                    {p.badge}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors flex items-center gap-2">
                      <span>{p.label}</span>
                    </div>
                    <div className="text-xs text-muted font-mono truncate mt-0.5 max-w-[260px]">
                      {s![p.key]}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(s![p.key] || "", `social-${p.key}`, p.label)}
                    className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                    title="Copy URL"
                  >
                    {copiedKey === `social-${p.key}` ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={s![p.key] || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                    title="Open Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted">
            <Globe className="w-8 h-8 mx-auto mb-2.5 opacity-40 text-muted" />
            <p className="text-sm font-medium text-foreground">No Social Profiles Detected</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              DeepWeb scanned HTML meta tags, OpenGraph data, and footer navigation links but found no recognized social links.
            </p>
          </div>
        )}
      </div>

      {/* Direct Contact Points */}
      {c && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
              Direct Contact & Channels
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Email Addresses */}
            {(() => {
              const validEmails = ((c.emails as string[]) || []).filter(
                (email) => typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
              );
              return (
                <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      <Mail className="w-3.5 h-3.5 text-accent" />
                      Email Addresses
                    </div>
                    <span className="text-xs font-mono text-muted">{validEmails.length} found</span>
                  </div>

                  {validEmails.length > 0 ? (
                    <div className="space-y-2">
                      {validEmails.map((email, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface-elevated border border-border/50 hover:border-border transition-colors group"
                        >
                          <a
                            href={`mailto:${email}`}
                            className="text-xs font-mono font-medium text-foreground hover:text-accent truncate transition-colors"
                          >
                            {email}
                          </a>
                          <button
                            onClick={() => copyToClipboard(email, `email-${i}`, "Email")}
                            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors flex-shrink-0"
                            title="Copy Email"
                          >
                            {copiedKey === `email-${i}` ? (
                              <Check className="w-3 h-3 text-success" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic py-2">No public emails discovered</p>
                  )}
                </div>
              );
            })()}

            {/* Phone Numbers */}
            {(() => {
              const validPhones = ((c.phones as string[]) || []).filter((phone) => {
                if (!phone || typeof phone !== "string") return false;
                if ((phone.match(/\./g) || []).length > 1) return false;
                if (/\d\s\d\s\d\s\d/.test(phone)) return false;
                const stripped = phone.replace(/[\s\-\.\(\)]/g, "");
                return /^\+?[0-9]{7,15}$/.test(stripped);
              });

              return (
                <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                      <Phone className="w-3.5 h-3.5 text-accent" />
                      Phone Lines
                    </div>
                    <span className="text-xs font-mono text-muted">{validPhones.length} found</span>
                  </div>

                  {validPhones.length > 0 ? (
                    <div className="space-y-2">
                      {validPhones.map((phone, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface-elevated border border-border/50 hover:border-border transition-colors group"
                        >
                          <a
                            href={`tel:${phone}`}
                            className="text-xs font-mono font-medium text-foreground hover:text-accent truncate transition-colors"
                          >
                            {phone}
                          </a>
                          <button
                            onClick={() => copyToClipboard(phone, `phone-${i}`, "Phone")}
                            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors flex-shrink-0"
                            title="Copy Phone"
                          >
                            {copiedKey === `phone-${i}` ? (
                              <Check className="w-3 h-3 text-success" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic py-2">No telephone numbers discovered</p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Physical Address */}
          {c.address && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Physical Headquarters / Address
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {c.address as string}
                  </p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(c.address as string, "address-main", "Address")}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors flex-shrink-0"
                title="Copy Address"
              >
                {copiedKey === "address-main" ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </motion.div>
          )}

          {/* Action Portals */}
          {(c.calendly_url || c.whatsapp_url || c.google_maps_url) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {c.calendly_url && (
                <a
                  href={c.calendly_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:border-accent/40 hover:shadow-md transition-all flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-foreground group-hover:text-accent transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                      Calendly Schedule
                      <ExternalLink className="w-3 h-3 text-muted opacity-60" />
                    </div>
                    <div className="text-[11px] text-muted truncate">Book direct meeting</div>
                  </div>
                </a>
              )}

              {c.whatsapp_url && (
                <a
                  href={c.whatsapp_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:border-accent/40 hover:shadow-md transition-all flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-foreground group-hover:text-accent transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                      WhatsApp Chat
                      <ExternalLink className="w-3 h-3 text-muted opacity-60" />
                    </div>
                    <div className="text-[11px] text-muted truncate">Instant messaging</div>
                  </div>
                </a>
              )}

              {c.google_maps_url && (
                <a
                  href={c.google_maps_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:border-accent/40 hover:shadow-md transition-all flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-foreground group-hover:text-accent transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                      Google Maps
                      <ExternalLink className="w-3 h-3 text-muted opacity-60" />
                    </div>
                    <div className="text-[11px] text-muted truncate">View location</div>
                  </div>
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SocialSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
    </div>
  );
}
