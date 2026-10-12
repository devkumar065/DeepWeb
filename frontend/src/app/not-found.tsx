import Link from "next/link";
import Logo from "@/components/Logo";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center mb-2">
          <Logo className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-accent px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
            404 — Not Found
          </span>
          <h1 className="text-3xl font-serif font-bold text-foreground mt-4">
            Lost in the Architecture
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            The page or report you requested could not be located in DeepWeb's scan index.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-xs shadow-sm hover:bg-accent-hover active:scale-95 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            Back to DeepWeb Scanner
          </Link>
        </div>
      </div>
    </div>
  );
}
