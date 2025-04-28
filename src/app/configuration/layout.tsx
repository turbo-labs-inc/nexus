import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuration | Nexus Platform",
  description: "Configure models, integrations, and MCP servers",
};

export default function ConfigurationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Configuration"
      breadcrumbs={[
        { label: "Configuration", href: "/configuration" }
      ]}
    >
      {children}
    </AppLayout>
  );
}