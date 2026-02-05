import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { SignInClient } from "./sign-in-client";
import { Suspense } from "react";

export const metadata: Metadata = { 
  title: "Sign In - Hive ERP",
  description: "Secure access to your workspace"
};

export default function SignInPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}