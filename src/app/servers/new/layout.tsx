import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Server | Nexus Platform",
  description: "Create a new MCP server configuration",
};

export default function NewServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="New Server"
      breadcrumbs={[
        { label: "Servers", href: "/servers" },
        { label: "New", href: "/servers/new" }
      ]}
    >
      {children}
    </AppLayout>
  );
}
