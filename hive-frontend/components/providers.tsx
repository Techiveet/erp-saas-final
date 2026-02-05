"use client"; // Critical: Must be a client component

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // We use useState to ensure the QueryClient is only created once per session
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Since this is an ERP (Hive), we might want a 1-minute stale time
        staleTime: 60 * 1000, 
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}