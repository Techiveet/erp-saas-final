"use client";

import { usePathname, useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { checkAuth } from "@/lib/api";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["auth-user"],
    queryFn: checkAuth, 
    retry: false, 
    staleTime: 1000 * 60 * 5, 
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("hive_token") : null;
    
    // Redirect if no token or if the session check fails
    if (!token || isError) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("hive_token");
        localStorage.removeItem("user_data");
      }
      
      // ✅ CHANGED: Check specifically for /sign-in
      if (!pathname.startsWith('/sign-in')) {
        const returnUrl = encodeURIComponent(pathname);
        // ✅ CHANGED: Redirect to /sign-in
        router.replace(`/sign-in?callbackUrl=${returnUrl}`);
      }
    }
  }, [isError, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}