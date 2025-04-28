"use client";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={cn("flex-1", className)}>{children}</main>
      <footer className="border-t py-12">
        <div className="container mx-auto">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold">Nexus Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link></li>
                <li><Link href="/profile" className="text-muted-foreground hover:text-primary">Profile</Link></li>
                <li><Link href="/docs" className="text-muted-foreground hover:text-primary">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">AI Features</h3>
              <ul className="space-y-2">
                <li><Link href="/models" className="text-muted-foreground hover:text-primary">AI Models</Link></li>
                <li><Link href="/workflow-demo" className="text-muted-foreground hover:text-primary">Workflow Designer</Link></li>
                <li><Link href="/chat" className="text-muted-foreground hover:text-primary">AI Chat</Link></li>
                <li><Link href="/servers" className="text-muted-foreground hover:text-primary">MCP Servers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Integrations</h3>
              <ul className="space-y-2">
                <li><Link href="/slack" className="text-muted-foreground hover:text-primary">Slack</Link></li>
                <li><Link href="/fast-agent-demo" className="text-muted-foreground hover:text-primary">Fast-Agent</Link></li>
                <li><Link href="/fast-agent-tools-demo" className="text-muted-foreground hover:text-primary">Agent Tools</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Terms</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Privacy</a></li>
                <li><a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © {new Date().getFullYear()} Nexus. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-5 w-6 rounded-bl-sm rounded-br-lg rounded-tl-lg rounded-tr-sm bg-gradient-lava" />
                <span className="font-bold">Nexus</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
