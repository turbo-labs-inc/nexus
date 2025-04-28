"use client";

import { MCPProvider } from "@/context/mcp-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";

// This is the default layout for regular app routes.
// It includes the MCPProvider that might block access when database tables don't exist.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MCPProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </ThemeProvider>
    </MCPProvider>
  );
}