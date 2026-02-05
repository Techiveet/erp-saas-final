// app/layout.tsx
import "./globals.css";

import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google"; // 👈 Added fonts

import type { Metadata } from "next";
import Providers from "@/components/providers";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Configure Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "HIVE | Enterprise Neural Network",
  description: "The neural network for modern enterprise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* ⚡ Applied font variables to body */}
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark" // Defaulting to dark fits the "Hive" aesthetic better
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}