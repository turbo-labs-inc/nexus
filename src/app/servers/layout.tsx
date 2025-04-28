import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Servers | Nexus Platform",
  description: "Manage MCP server connections and configurations",
};

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="MCP Servers"
      breadcrumbs={[
        { label: "Servers", href: "/servers" }
      ]}
    >
      {children}
    </AppLayout>
  );
}