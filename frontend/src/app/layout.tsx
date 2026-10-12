import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeepWeb — Scan & Analyze Any Website",
  description:
    "Paste any website URL and DeepWeb scans it in seconds. Get all pages, tech stack, brand colors, SEO analysis, screenshots, and AI insights in one place.",
  keywords: [
    "website scanner",
    "tech stack detector",
    "website analysis",
    "SEO checker",
    "brand color extractor",
    "DeepWeb",
  ],
  openGraph: {
    title: "DeepWeb — Scan & Analyze Any Website",
    description:
      "Paste any website URL and get a full report: pages, tech stack, colors, SEO, screenshots, and AI insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground h-screen w-screen overflow-hidden relative selection:bg-accent selection:text-accent-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {/* Subtle noise texture */}
          <div className="pointer-events-none fixed inset-0 z-[-1]">
            <div 
              className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035] mix-blend-overlay"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />
          </div>
          
          {children}

          <Toaster
            position="bottom-right"
            theme="system"
            toastOptions={{
              className: "border border-border bg-surface text-foreground shadow-lg font-sans text-sm rounded-xl",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
