"use client";

import { Menu, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const navItems = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "AI Models",
    href: "/models",
  },
  {
    name: "Servers",
    href: "/servers",
  },
  {
    name: "Integrations",
    href: "#",
    children: [
      {
        name: "Slack",
        href: "/slack",
      },
      // Future integrations would go here
    ],
  },
  {
    name: "Tools",
    href: "#",
    children: [
      {
        name: "Chat",
        href: "/chat",
      },
      {
        name: "Workflow Designer",
        href: "/workflow-demo",
      },
    ],
  },
  {
    name: "Demos",
    href: "#",
    children: [
      {
        name: "Fast-Agent Basic",
        href: "/fast-agent-demo",
      },
      {
        name: "Fast-Agent Tools",
        href: "/fast-agent-tools-demo",
      },
      {
        name: "Sidebar Layout",
        href: "/sidebar-demo",
      },
      {
        name: "Component Demo",
        href: "/#component-demo",
      },
    ],
  },
  {
    name: "Documentation",
    href: "/docs",
  },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, signOut, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center">
            <img src="/logo.svg" alt="Nexus" className="h-8 sm:h-10" />
          </Link>
        </div>

        <div className="hidden flex-1 items-center md:flex">
          <nav className="flex items-center gap-5 text-sm">
            {navItems.map((item, index) =>
              item.children ? (
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "group flex items-center gap-1 text-base font-medium h-9 px-3",
                        pathname.startsWith(item.href) && "text-foreground"
                      )}
                    >
                      {item.name}
                      <ChevronDown className="h-4 w-4 transition duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {item.children.map((child, childIndex) => (
                      <DropdownMenuItem key={childIndex} asChild>
                        <Link
                          href={child.href}
                          className={cn(
                            pathname === child.href
                              ? "font-medium text-foreground"
                              : "text-foreground/60"
                          )}
                        >
                          {child.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "text-base font-medium transition-colors hover:text-foreground/80 px-3 py-2",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  {item.name}
                </Link>
              )
            )}
          </nav>
          
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {isLoading ? (
              <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
            ) : isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Logout
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 h-8 w-8">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0">
              <SheetHeader className="px-1">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Access the main navigation menu</SheetDescription>
              </SheetHeader>
              <nav className="mt-8 grid gap-2 py-1">
                {navItems.map((item, index) =>
                  item.children ? (
                    <div key={index} className="flex flex-col gap-2 px-1 py-1">
                      <p className="px-2 text-base font-medium">{item.name}</p>
                      <div className="grid gap-1 pl-4">
                        {item.children.map((child, childIndex) => (
                          <Link
                            key={childIndex}
                            href={child.href}
                            className={cn(
                              "px-2 py-1 text-base transition-colors hover:text-foreground/80",
                              pathname === child.href
                                ? "font-medium text-foreground"
                                : "text-foreground/60"
                            )}
                            onClick={() => setOpen(false)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={index}
                      href={item.href}
                      className={cn(
                        "px-2 py-1 text-base transition-colors hover:text-foreground/80",
                        pathname === item.href || pathname.startsWith(item.href + "/")
                          ? "font-medium text-foreground"
                          : "text-foreground/60"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )
                )}
              </nav>
              <div className="mt-6 px-1">
                {isLoading ? (
                  <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                ) : isAuthenticated ? (
                  <Button className="w-full" variant="outline" onClick={() => signOut()}>
                    Logout
                  </Button>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href="/auth/login">Login</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
