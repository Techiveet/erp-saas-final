// hive-frontend/components/auth/use-auth-logic.ts
"use client";

import { initializeCsrf, login } from "@/lib/api"; // ✅ Import initializeCsrf
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LoginFormData } from "@/lib/validations/auth";

const STORAGE_KEY = "hive_limiter";
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

export function useAuthLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackURL") || "/dashboard";

  const [step, setStep] = useState<"login" | "2fa">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidatingTenant, setIsValidatingTenant] = useState(false);
  const [isTenantFound, setIsTenantFound] = useState(true);
  
  const [otp, setOtp] = useState("");
  const [tempCreds, setTempCreds] = useState<LoginFormData | null>(null);

  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  // Initialize Local Rate Limiter state
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      setAttempts(data.attempts);
      setLockedUntil(data.lockedUntil);
    }
  }, []);

  const recordFailure = () => {
    const newAttempts = attempts + 1;
    let newLock = lockedUntil;
    if (newAttempts >= MAX_ATTEMPTS) {
      newLock = Date.now() + (LOCK_SECONDS * 1000);
    }
    const state = { attempts: newAttempts, lockedUntil: newLock };
    setAttempts(newAttempts);
    setLockedUntil(newLock);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const resetLimiter = () => {
    setAttempts(0);
    setLockedUntil(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isLocked = lockedUntil > Date.now();
  const lockRemaining = isLocked ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;

  /**
   * Main Login Handler
   */
  const handleLogin = async (data: LoginFormData) => {
    if (isLocked) return;
    setLoading(true);
    setError(null);

    try {
      // 1. ✅ PRIME CSRF COOKIE
      // This hits /sanctum/csrf-cookie to prevent "CSRF token mismatch"
      await initializeCsrf();

      // 2. Prepare Payload
      const payload = {
        ...data,
        device_name: "Hive Web Interface",
        otp: step === "2fa" ? otp : undefined,
      };

      // 3. Request Login
      const res = await login(payload);

      // 4. Handle 2FA Interception
      if (res.two_factor_required) {
        setStep("2fa");
        setTempCreds(data); // Store credentials to retry with OTP
        setLoading(false);
        return;
      }

      // 5. Success Flow
      const token = res.token || res.access_token;
      if (token) {
        // Standard session setup
        localStorage.setItem("hive_token", token);
        localStorage.setItem("user_data", JSON.stringify(res.user));
        
        resetLimiter();
        
        router.push(callbackUrl);
        router.refresh();
      } else {
        throw new Error("Security token missing from response.");
      }

    } catch (err: any) {
      console.error("Authentication Error:", err);

      // Handle specific Laravel error responses
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 429) {
        setError("System locked due to too many requests. Please wait.");
        recordFailure();
      } else if (status === 401 || status === 422) {
        // 422 is often used by Laravel for validation/invalid OTP
        setError(message || "Invalid credentials or authentication code.");
        if (step === "login") recordFailure();
      } else if (status === 404) {
        setIsTenantFound(false);
      } else {
        setError(message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2FA Form Submission
   */
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    if (tempCreds) handleLogin(tempCreds);
  };

  return {
    step,
    setStep,
    loading,
    error,
    isValidatingTenant,
    isTenantFound,
    otp,
    setOtp,
    handleLogin,
    handleOtpSubmit,
    isLocked,
    lockRemaining
  };
}