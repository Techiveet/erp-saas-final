"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  Command,
  Fingerprint,
  Github,
  Globe,
  Loader2,
  Lock,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun
} from "lucide-react";
import { LoginFormData, loginSchema } from "@/lib/validations/auth";
import { useEffect, useState } from "react"; // ✅ Import useState & useEffect

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAuthLogic } from "@/components/auth/use-auth-logic";
import { useForm } from "react-hook-form";
import { useTheme } from "next-themes";
import { zodResolver } from "@hookform/resolvers/zod";

export function SignInClient() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false); // ✅ Fix Hydration Mismatch

  // Wait for client to mount before rendering theme icons
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Connect Logic Hook
  const { 
    step, setStep, loading, error, isLocked, lockRemaining,
    otp, setOtp, handleLogin, handleOtpSubmit 
  } = useAuthLogic();

  // 2. Connect React Hook Form
  const { 
    register, 
    handleSubmit, 
    formState: { errors: fieldErrors } 
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground overflow-hidden relative font-sans">
      
      {/* --- BACKGROUND GRID --- */}
      <div className="tech-grid fixed inset-0 z-0 opacity-20 pointer-events-none" />

      {/* --- FLOATING CONTROLS --- */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
         <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full hover:bg-primary/10 hover:text-primary"
         >
            {/* ✅ Only render icon after mount to prevent mismatch */}
            {mounted ? (
              theme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>
            ) : (
              <div className="h-4 w-4" /> // Invisible placeholder
            )}
         </Button>
      </div>

      {/* --- LEFT SIDE: FORM --- */}
      <div className="relative flex flex-col justify-center px-8 sm:px-20 py-12 z-10 bg-background/80 backdrop-blur-sm lg:border-r border-border">
        <Link href="/" className="absolute top-8 left-8 sm:left-20 flex items-center gap-2 font-space text-xl font-bold tracking-tight hover:text-primary transition-colors">
          <Globe className="text-primary h-6 w-6" /> HIVE.OS
        </Link>

        <div className="w-full max-w-sm mx-auto space-y-8 mt-12 lg:mt-0">
          
          {/* HEADER */}
          <div className="space-y-2">
            <h1 className="text-3xl font-space font-bold tracking-tighter animate-in fade-in slide-in-from-left-4 duration-500">
              {step === "login" ? "Command Access" : "Identity Verification"}
            </h1>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest animate-in fade-in slide-in-from-left-4 duration-700">
              {step === "login" ? "Enter credentials to decrypt session" : "Enter 2FA code from authenticator"}
            </p>
          </div>

          {/* GLOBAL ERROR & LOCKOUT */}
          {isLocked ? (
            <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400 font-mono text-xs">
               <AlertCircle className="h-4 w-4" />
               <AlertDescription>
                 SECURITY LOCKOUT: Retry in {lockRemaining}s
               </AlertDescription>
            </Alert>
          ) : error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/50 text-destructive font-mono text-xs animate-in fade-in zoom-in-95">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* --- STEP 1: LOGIN FORM --- */}
          {step === "login" && (
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-4 animate-in fade-in duration-500">
              
              {/* EMAIL */}
              <div className="grid gap-2">
                <Label htmlFor="email" className={`font-mono text-xs ${fieldErrors.email ? "text-destructive" : "text-primary"}`}>
                  IDENTIFIER (EMAIL)
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    {...register("email")}
                    placeholder="user@hive.corp" 
                    disabled={loading || isLocked}
                    className={`pl-10 h-11 rounded-lg font-mono bg-muted/30 border-primary/20 focus:border-primary focus:bg-background transition-all ${fieldErrors.email ? "border-destructive focus:border-destructive" : ""}`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[10px] text-destructive font-mono mt-1">{fieldErrors.email.message}</p>
                )}
              </div>
              
              {/* PASSWORD */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                   <Label htmlFor="password" className="font-mono text-xs text-primary">PASSPHRASE</Label>
                   <Link href="#" className="font-mono text-[10px] text-muted-foreground hover:text-primary hover:underline">RECOVER KEY?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    {...register("password")}
                    placeholder="••••••••" 
                    disabled={loading || isLocked}
                    className="pl-10 h-11 rounded-lg font-mono bg-muted/30 border-primary/20 focus:border-primary focus:bg-background transition-all"
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-[10px] text-destructive font-mono mt-1">{fieldErrors.password.message}</p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <Button 
                type="submit" 
                disabled={loading || isLocked}
                className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 font-space tracking-wider shadow-[0_0_20px_hsl(var(--primary)/0.3)] h-12 rounded-lg mt-4 transition-transform active:scale-[0.98]"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AUTHENTICATING...</>
                ) : (
                  "AUTHENTICATE"
                )}
              </Button>
            </form>
          )}

          {/* --- STEP 2: 2FA FORM --- */}
          {step === "2fa" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
               <div className="grid gap-2">
                <Label htmlFor="otp" className="font-mono text-xs text-primary">
                  SECURITY CODE
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <Input 
                    id="otp" 
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000 000" 
                    disabled={loading}
                    className="pl-10 h-12 rounded-lg font-mono bg-muted/30 border-primary/20 focus:border-primary transition-all text-center tracking-[0.5em] font-bold text-lg"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 font-space tracking-wider shadow-[0_0_20px_hsl(var(--primary)/0.3)] h-12 rounded-lg"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> VERIFYING...</>
                ) : (
                  "CONFIRM ACCESS"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep("login")}
                className="flex w-full items-center justify-center gap-2 text-[10px] font-mono uppercase text-muted-foreground hover:text-primary transition-colors pt-2"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Login
              </button>
            </form>
          )}

          {/* FOOTER */}
          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-mono">Or connect via</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all font-mono text-xs border-border/60">
              <Github className="mr-2 h-4 w-4" /> GITHUB_KEY
            </Button>
            <Button variant="outline" className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all font-mono text-xs border-border/60">
              <Command className="mr-2 h-4 w-4" /> SSO_TOKEN
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-4">
            No clearance? <Link href="/auth/signup" className="text-primary hover:underline font-bold transition-colors">Request Node Access</Link>
          </p>
        </div>
      </div>

      {/* --- RIGHT SIDE: VISUALS --- */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-muted/5 border-l border-border overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        
        {/* Central 3D Element */}
        <div className="relative z-10 m-auto w-full max-w-md aspect-square">
           <div className="absolute inset-0 border border-primary/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
           <div className="absolute inset-4 border border-dashed border-primary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
           
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="glass-panel p-8 rounded-2xl relative overflow-hidden w-64 h-64 flex flex-col items-center justify-center border border-primary/20 shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/50 animate-scan-beam shadow-[0_0_15px_hsl(var(--primary))]"></div>
               <ShieldCheck className="w-16 h-16 text-primary mb-4 animate-pulse drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
               <div className="font-space font-bold text-lg tracking-tight">SECURE GATEWAY</div>
               <div className="font-mono text-xs text-muted-foreground mt-2">v3.1.0-RC4</div>
               <div className="mt-4 flex gap-1">
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
             </div>
           </div>
        </div>

        {/* System Logs */}
        <div className="font-mono text-[10px] text-muted-foreground opacity-70 z-10 w-full max-w-md mx-auto space-y-1">
          <div className="flex justify-between border-b border-border/30 pb-1"><span>&gt; SYSTEM_READY</span> <span className="text-green-500">[OK]</span></div>
          <div className="flex justify-between border-b border-border/30 pb-1"><span>&gt; ENCRYPTION_HANDSHAKE</span> <span className="text-green-500">[OK]</span></div>
          <div className="flex justify-between border-b border-border/30 pb-1"><span>&gt; BIOMETRIC_SCAN</span> <span className="animate-pulse text-yellow-500">[WAITING]</span></div>
        </div>
      </div>

    </div>
  );
}