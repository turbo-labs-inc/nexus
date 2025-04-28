import Link from "next/link";

import { ComponentDemo } from "@/components/demo";
import { Container } from "@/components/layout/container";
import { FeatureShowcase } from "@/components/layout/feature-showcase";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  return (
    <MainLayout>
      <Container>
        <FeatureShowcase />
      </Container>

      <Container className="py-12">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">Explore the Platform</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/models" className="group">
            <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-md">
              <CardHeader>
                <CardTitle>AI Model Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configure and manage models from Anthropic, OpenAI, and other providers.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/slack" className="group">
            <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-md">
              <CardHeader>
                <CardTitle>Slack Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect your AI workflows to Slack channels and workspaces.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/workflow-demo" className="group">
            <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-md">
              <CardHeader>
                <CardTitle>Workflow Orchestration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Build complex automation workflows with a visual designer.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Interactive Demos</CardTitle>
            <CardDescription>
              Try out the core features of the Nexus platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="outline">
                <Link href="/fast-agent-demo">Fast-Agent Demo</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/fast-agent-tools-demo">Agent Tools Demo</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/workflow-demo">Workflow Designer</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sidebar-demo">Sidebar Layout</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/#component-demo">Component Library</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div id="component-demo" className="mt-12 scroll-mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Component Library</h2>
          <ComponentDemo />
        </div>
      </Container>
    </MainLayout>
  );
}
