# Mobile Foundation Setup with Road to Next Stack

## Overview

This document outlines the setup process for creating a mobile-first foundation using the Road to Next stack. The implementation focuses on establishing a solid base that works seamlessly across both mobile and desktop devices, with a focus on responsive design and optimal user experience.

## Tech Stack Components

Based on the Road to Next course by Robin Wieruch, our mobile foundation will utilize these key technologies:

1. **Next.js 15** - Full-stack React framework
2. **React 19** - Frontend component library
3. **TypeScript** - Type-safe JavaScript
4. **Tailwind CSS** - Utility-first CSS framework with built-in mobile-first approach
5. **Shadcn/UI** - Customizable component library
6. **Oslo** - Zero vendor lock-in authentication library
7. **Supabase** - Serverless Postgres database
8. **Zod** - TypeScript-first schema validation
9. **Vercel** - Deployment platform optimized for Next.js

## Implementation Steps

### 1. Project Setup

First, we'll create a new Next.js 15 project with the appropriate configuration:

```bash
# Create a new Next.js project
npx create-next-app@latest mcp-client-pwa
```

During the setup, select the following options:

- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: Yes (default @/\*)

### 2. Install Additional Dependencies

```bash
# Navigate to project directory
cd mcp-client-pwa

# Install core dependencies
npm install shadcn-ui @oslo/auth zod @supabase/supabase-js

# Install development dependencies
npm install -D prettier prettier-plugin-tailwindcss
```

### 3. Configure Tailwind CSS for Mobile-First Approach

Tailwind CSS already uses a mobile-first approach by default. We'll enhance the configuration to ensure optimal responsive design:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "375px",
        // Default Tailwind breakpoints
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: [],
};
```

### 4. Set Up Shadcn/UI Components

```bash
# Initialize Shadcn UI
npx shadcn-ui@latest init
```

During initialization, select:

- Style: Default
- Base color: Slate
- Global CSS: src/app/globals.css
- CSS variables: Yes
- React Server Components: Yes
- Components directory: @/components
- Utility directory: @/lib/utils

### 5. Create Responsive Layout Components

Create a basic responsive layout structure that adapts to different screen sizes:

```tsx
// src/components/layout/mobile-container.tsx
import React from "react";

interface MobileContainerProps {
  children: React.ReactNode;
}

export function MobileContainer({ children }: MobileContainerProps) {
  return <div className="mx-auto w-full max-w-md px-4 md:max-w-2xl lg:max-w-4xl">{children}</div>;
}
```

```tsx
// src/components/layout/responsive-grid.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
}

export function ResponsiveGrid({
  children,
  className,
  columns = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
  },
  gap = "gap-4",
}: ResponsiveGridProps) {
  const gridClasses = cn(
    "grid",
    gap,
    columns.xs && `grid-cols-${columns.xs}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    className
  );

  return <div className={gridClasses}>{children}</div>;
}
```

### 6. Create Basic Navigation Components

```tsx
// src/components/layout/mobile-nav.tsx
import React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  title: string;
  href: string;
}

interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  return (
    <div className="flex md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="flex flex-col gap-4">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-lg font-medium transition-colors hover:text-primary"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

```tsx
// src/components/layout/desktop-nav.tsx
import React from "react";
import Link from "next/link";

interface NavItem {
  title: string;
  href: string;
}

interface DesktopNavProps {
  items: NavItem[];
}

export function DesktopNav({ items }: DesktopNavProps) {
  return (
    <nav className="hidden md:flex md:gap-6">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm font-medium transition-colors hover:text-primary"
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
```

```tsx
// src/components/layout/header.tsx
import React from "react";
import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import { DesktopNav } from "./desktop-nav";

const navItems = [
  { title: "Home", href: "/" },
  { title: "Chat", href: "/chat" },
  { title: "Documents", href: "/documents" },
  { title: "Projects", href: "/projects" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold">
            MCP Client
          </Link>
        </div>
        <MobileNav items={navItems} />
        <DesktopNav items={navItems} />
      </div>
    </header>
  );
}
```

### 7. Create Root Layout with Mobile Optimizations

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCP Client PWA",
  description: "Mobile-first PWA for interacting with MCP servers",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

### 8. Create Example Pages with Responsive Design

```tsx
// src/app/page.tsx
import { MobileContainer } from "@/components/layout/mobile-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <MobileContainer>
      <div className="py-10">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">Welcome to MCP Client</h1>
        <p className="mb-8 text-muted-foreground">
          A mobile-first PWA for interacting with MCP servers
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Chat Interface</CardTitle>
              <CardDescription>Interact with AI models through MCP servers</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Access powerful AI capabilities with a user-friendly chat interface.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/chat">Open Chat</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>Organize and interact with your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Upload, organize, and analyze documents with AI assistance.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/documents">View Documents</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
}
```

### 9. Add PWA Support

Create a manifest file for PWA support:

```json
// public/manifest.json
{
  "name": "MCP Client PWA",
  "short_name": "MCP Client",
  "description": "Mobile-first PWA for interacting with MCP servers",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Add a basic service worker for offline capabilities:

```javascript
// public/service-worker.js
const CACHE_NAME = "mcp-client-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
```

Register the service worker in the app:

```tsx
// src/app/service-worker.tsx
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/service-worker.js").then(
          function (registration) {
            console.log("ServiceWorker registration successful with scope: ", registration.scope);
          },
          function (err) {
            console.log("ServiceWorker registration failed: ", err);
          }
        );
      });
    }
  }, []);

  return null;
}
```

Add the service worker registration to the layout:

```tsx
// src/app/layout.tsx (updated)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { ServiceWorkerRegistration } from "./service-worker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCP Client PWA",
  description: "Mobile-first PWA for interacting with MCP servers",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
```

### 10. Add Mobile Touch Optimizations

Create a hook for handling touch gestures:

```tsx
// src/hooks/use-touch-gestures.ts
"use client";

import { useEffect, useRef, useState } from "react";

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeDirection {
  horizontal: "left" | "right" | null;
  vertical: "up" | "down" | null;
}

interface UseTouchGesturesProps {
  onSwipe?: (direction: SwipeDirection) => void;
  threshold?: number;
}

export function useTouchGestures({ onSwipe, threshold = 50 }: UseTouchGesturesProps = {}) {
  const [isTouching, setIsTouching] = useState(false);
  const startPos = useRef<TouchPosition | null>(null);
  const currentPos = useRef<TouchPosition | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setIsTouching(true);
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      currentPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching) return;
      const touch = e.touches[0];
      currentPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = () => {
      setIsTouching(false);

      if (startPos.current && currentPos.current && onSwipe) {
        const deltaX = currentPos.current.x - startPos.current.x;
        const deltaY = currentPos.current.y - startPos.current.y;

        const direction: SwipeDirection = {
          horizontal: null,
          vertical: null,
        };

        if (Math.abs(deltaX) > threshold) {
          direction.horizontal = deltaX > 0 ? "right" : "left";
        }

        if (Math.abs(deltaY) > threshold) {
          direction.vertical = deltaY > 0 ? "down" : "up";
        }

        if (direction.horizontal || direction.vertical) {
          onSwipe(direction);
        }
      }

      startPos.current = null;
      currentPos.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isTouching, onSwipe, threshold]);

  return { isTouching };
}
```

### 11. Create a Theme Toggle Component

```tsx
// src/components/ui/theme-toggle.tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

Add theme provider to the layout:

```tsx
// src/providers/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

Update the layout to include the theme provider:

```tsx
// src/app/layout.tsx (updated)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { ServiceWorkerRegistration } from "./service-worker";
import { ThemeProvider } from "@/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCP Client PWA",
  description: "Mobile-first PWA for interacting with MCP servers",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Testing Mobile Responsiveness

To verify that our mobile foundation works correctly across different device sizes, we'll test the application on various screen sizes:

1. **Mobile (375px)**: Verify that the layout is optimized for small screens
2. **Tablet (768px)**: Check that the layout adapts appropriately
3. **Desktop (1024px+)**: Ensure the layout takes advantage of larger screens

Use the following testing methods:

- Browser developer tools with device emulation
- Responsive design mode in browsers
- Physical device testing when possible

## Conclusion

This mobile foundation setup provides a solid base for building a responsive PWA using the Road to Next stack. The implementation includes:

- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for mobile-first styling
- Shadcn/UI for customizable components
- Responsive layout components
- Mobile navigation with touch optimizations
- PWA support with service worker
- Dark/light theme support

This foundation can now be extended with additional features like Supabase authentication, chat interface, and MCP integration in subsequent implementation phases.
