import type { Metadata, Viewport } from "next";
import { Inter as FontSans, JetBrains_Mono as FontMono } from "next/font/google";
import Script from "next/script";

import { AuthProvider } from "@/context/auth-context";
import { MCPProvider } from "@/context/mcp-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { SupabaseInit } from "@/components/supabase-init";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Nexus Platform",
  description: "Next.js PWA with MCP integration and Fast-Agent capabilities",
  applicationName: "Nexus Platform",
  authors: [{ name: "Nexus Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexus Platform",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7000FF" },
    { media: "(prefers-color-scheme: dark)", color: "#7000FF" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="mask-icon" href="/icons/icon.svg" color="#7000FF" />
        <meta name="msapplication-TileColor" content="#7000FF" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <SupabaseInit />
        <AuthProvider>
          {/* Admin routes have their own layout that excludes the MCPProvider */}
          {children}
        </AuthProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}