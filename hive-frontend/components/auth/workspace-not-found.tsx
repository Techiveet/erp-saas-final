// hive-frontend/components/auth/workspace-not-found.tsx
"use client";

import { AlertTriangle, Home, LifeBuoy, SearchX } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle"; // Uses your existing toggle

interface NotFoundProps {
  title?: string;
  message?: React.ReactNode;
}

export function WorkspaceNotFound({ title, message }: NotFoundProps) {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length > 1 && hostname !== 'localhost') {
        setSubdomain(parts[0]);
      }
    }
  }, []);

  const displayTitle = title || (subdomain ? "Workspace Not Found" : "404 Not Found");
  
  const displayMessage = message || (subdomain ? (
    <>
      The workspace <span className="font-bold text-foreground bg-destructive/10 px-2 py-0.5 rounded-md mx-1 border border-destructive/20 text-destructive">{subdomain}</span> does not exist or has been deactivated.
    </>
  ) : (
    "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
  ));

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background font-sans text-foreground transition-colors duration-500">
      
      {/* --- CSS ANIMATIONS --- */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* --- BACKGROUND LAYERS (Matches Sign In) --- */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 hive-mesh-bg opacity-100 dark:opacity-40" />
        <div className="absolute inset-0 hive-grid-mask opacity-40 dark:opacity-20" />
        <div className="absolute inset-0 hive-noise" />
      </div>

      {/* --- THEME TOGGLE --- */}
      <div className="absolute right-6 top-6 z-50">
        <ThemeToggle />
      </div>

      {/* --- MAIN CARD --- */}
      <div className="relative mx-4 w-full max-w-lg">
        <div className="glass-panel overflow-hidden rounded-[2.5rem] p-10 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-700 slide-in-from-bottom-8 border-white/40 dark:border-white/10">
          
          {/* Background Glow inside card */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-primary/20 blur-[80px] rounded-full pointer-events-none" />

          {/* --- ANIMATED ICON --- */}
          <div className="relative mb-8 flex justify-center">
            <div className="relative flex h-28 w-28 items-center justify-center animate-float">
              {/* Outer Rings */}
              <div className="absolute inset-0 rounded-[2rem] border-2 border-destructive/20 dark:border-destructive/30 rotate-12 scale-110" />
              <div className="absolute inset-0 rounded-[2rem] border-2 border-dashed border-destructive/20 dark:border-destructive/30 -rotate-6 scale-125 opacity-50" />
              
              {/* Inner Box */}
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-gradient-to-br from-white to-slate-100 shadow-xl ring-1 ring-black/5 dark:from-slate-800 dark:to-slate-900 dark:ring-white/10 z-10">
                <div className="absolute inset-0 rounded-[1.8rem] bg-destructive/5 blur-xl" />
                {subdomain ? (
                  <SearchX className="relative h-10 w-10 text-destructive" />
                ) : (
                  <AlertTriangle className="relative h-10 w-10 text-amber-500" />
                )}
              </div>
            </div>
          </div>

          {/* --- TEXT CONTENT --- */}
          <div className="relative z-10 space-y-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance text-foreground">
              {displayTitle}
            </h1>
            
            <p className="text-base text-muted-foreground text-balance leading-relaxed max-w-sm mx-auto">
              {displayMessage}
            </p>
          </div>

          {/* --- ACTIONS --- */}
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button 
              onClick={() => window.location.href = 'http://localhost:3000/sign-in'}
              className="h-12 rounded-xl px-8 text-base font-bold shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95" 
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Central Login
            </Button>

            <Button 
              variant="outline"
              className="h-12 rounded-xl px-8 text-base font-medium border-border/60 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all active:scale-95"
              size="lg"
              asChild
            >
              <Link href="mailto:support@hive.com">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Support
              </Link>
            </Button>
          </div>

          {/* Footer Note */}
          <div className="mt-10 border-t border-border/40 pt-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
              Hive ERP System • Error 404
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}