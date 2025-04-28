"use client";

import { Container } from "@/components/layout/container";
import { HeroSection } from "@/components/layout/hero-section";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";

export default function SidebarDemoPage() {
  return (
    <MainLayout>
      <HeroSection
        title="Sidebar Layout"
        description="Example of a responsive and collapsible sidebar navigation component"
      />

      <Container className="py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About this demo</CardTitle>
            <CardDescription>
              This page demonstrates a collapsible sidebar component that works on both desktop and
              mobile devices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The sidebar component below is fully responsive and includes:
            </p>
            <ul className="ml-6 mt-2 list-disc text-muted-foreground">
              <li>Collapsible desktop sidebar that can be toggled</li>
              <li>Mobile-friendly slide-out menu</li>
              <li>Animated transitions for a smooth user experience</li>
              <li>Dark mode support</li>
            </ul>
          </CardContent>
        </Card>

        <div className="h-[600px] overflow-hidden rounded-lg border">
          <CollapsibleSidebar />
        </div>
      </Container>
    </MainLayout>
  );
}
