"use client";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
  breadcrumbs?: Array<{ label: string, href: string }>;
  title?: string;
}

export function AppLayout({ 
  children, 
  className, 
  showHeader = true, 
  showSidebar = true,
  breadcrumbs,
  title
}: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Only render sidebar after client-side hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only hide header on desktop when the sidebar is shown
  // Mobile always shows the header regardless of sidebar
  const shouldShowHeader = showHeader && (!(mounted && isAuthenticated && showSidebar) || typeof window !== 'undefined' && window.innerWidth < 768);
  
  return (
    <div className="flex min-h-screen flex-col">
      {shouldShowHeader && <Header />}
      
      <div className="flex flex-1">
        {mounted && isAuthenticated && showSidebar && <SidebarNavigation />}
        
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          mounted && isAuthenticated && showSidebar ? "md:pl-64" : "",
          className
        )}>
          {/* Page header with breadcrumbs and title */}
          {(breadcrumbs || title) && (
            <div className="border-b bg-muted/30 px-4 py-3 md:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                {breadcrumbs && (
                  <Breadcrumb items={breadcrumbs} />
                )}
                {title && (
                  <h1 className="my-1 text-2xl font-bold tracking-tight md:text-3xl">
                    {title}
                  </h1>
                )}
              </div>
            </div>
          )}
          
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}