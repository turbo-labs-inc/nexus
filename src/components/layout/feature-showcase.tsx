"use client";

import Link from "next/link";
import { ArrowRight, Bot, GitBranch, MessagesSquare, Server, MessageSquare, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";

export function FeatureShowcase() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Bot className="h-10 w-10 text-primary" />,
      title: "AI Models",
      description: "Connect to powerful AI models from different providers.",
      href: "/models"
    },
    {
      icon: <Server className="h-10 w-10 text-primary" />,
      title: "MCP Servers",
      description: "Manage Model Context Protocol servers for AI capabilities.",
      href: "/servers"
    },
    {
      icon: <GitBranch className="h-10 w-10 text-primary" />,
      title: "Workflow Designer",
      description: "Create automation workflows with a visual designer.",
      href: "/workflow-demo"
    },
    {
      icon: <MessagesSquare className="h-10 w-10 text-primary" />,
      title: "Multimodal Chat",
      description: "Chat with AI models with text, images, and more.",
      href: "/chat"
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-primary" />,
      title: "Slack Integration",
      description: "Connect Slack workspaces to your AI workflows.",
      href: "/slack"
    },
    {
      icon: <Braces className="h-10 w-10 text-primary" />,
      title: "Fast-Agent Tools",
      description: "Build powerful AI agents with tool-use capabilities.",
      href: "/fast-agent-tools-demo"
    }
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 py-10 md:py-12 lg:py-20">
      {/* Hero Header */}
      <div className="flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          Next-Generation AI Platform
        </div>
        <h1 className="bg-gradient-fire-purple bg-clip-text text-4xl font-bold leading-tight tracking-tighter text-transparent md:text-5xl lg:text-6xl/none">
          Build powerful AI applications with Nexus
        </h1>
        <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground md:text-xl">
          Nexus is a platform for connecting to AI models, orchestrating workflows, and building
          intelligent applications with ease.
        </p>
        <div className="flex gap-4">
          {isAuthenticated ? (
            <Button asChild size="lg" className="bg-gradient-fire-purple text-white border-0 hover:opacity-90">
              <Link href="/dashboard">
                Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="bg-gradient-fire-purple text-white border-0 hover:opacity-90">
              <Link href="/auth/login">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href="/docs">Learn More</Link>
          </Button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Link href={feature.href} key={index}>
            <Card className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {/* Platform Highlights */}
      <div className="mt-8 grid w-full gap-8 rounded-lg border bg-gradient-to-b from-card to-card/80 p-8 shadow-sm md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
          <h3 className="text-xl font-semibold">Easy Integration</h3>
          <p className="text-muted-foreground">Connect to popular AI models and tools with minimal setup.</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 10h16"/><path d="M4 14h16"/><path d="M9 18l3 3 3-3"/><path d="M9 6l3-3 3 3"/></svg>
          </div>
          <h3 className="text-xl font-semibold">Visual Workflows</h3>
          <p className="text-muted-foreground">Design complex automation flows without coding.</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 className="text-xl font-semibold">Extensible Platform</h3>
          <p className="text-muted-foreground">Build your own components and integrate with existing systems.</p>
        </div>
      </div>
    </div>
  );
}