import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebIntel — Website Intelligence & Reverse Engineering Platform",
  description:
    "Production-grade website intelligence platform. Discover every page, extract brand assets, detect tech stacks, analyze SEO, and generate AI insights for any website.",
  keywords: [
    "website intelligence",
    "web reverse engineering",
    "tech stack detection",
    "website analysis",
    "SEO analysis",
    "brand extraction",
  ],
  openGraph: {
    title: "WebIntel — Website Intelligence Platform",
    description:
      "Analyze any website in depth: pages, assets, tech stack, SEO, brand, and AI insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}
      >
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#fff",
              fontFamily: "inherit",
            },
          }}
        />
      </body>
    </html>
  );
}
