"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  className?: string;
  variant?: "segmented" | "compact";
}

export default function ThemeToggle({ className = "", variant = "segmented" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`flex items-center p-1 rounded-full bg-bg-elevated border border-border h-9 w-[104px] opacity-70 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const options = [
    { id: "light", label: "Light Mode", icon: Sun },
    { id: "dark", label: "Dark Mode", icon: Moon },
    { id: "system", label: "System Theme", icon: Laptop },
  ] as const;

  if (variant === "compact") {
    const isDark = resolvedTheme === "dark";
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`w-9 h-9 rounded-full flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-sm focus-visible:outline-none cursor-pointer ${className}`}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        {isDark ? (
          <Moon className="w-4 h-4 transition-transform hover:rotate-12" />
        ) : (
          <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className={`relative flex items-center p-0.5 rounded-full bg-bg-elevated border border-border shadow-sm ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.id;

        return (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            className={`relative z-10 w-8 h-7.5 rounded-full flex items-center justify-center text-xs transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? "text-text-main font-medium"
                : "text-text-muted hover:text-text-main"
            }`}
            aria-label={opt.label}
            title={opt.label}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.div
                layoutId="theme-active-indicator"
                className="absolute inset-0 rounded-full bg-bg shadow-sm border border-border/80"
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-20" />
          </button>
        );
      })}
    </div>
  );
}
