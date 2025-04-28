import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Server | Nexus Platform",
  description: "Edit MCP server configuration",
};

interface ServerEditLayoutProps {
  children: React.ReactNode;
  params: {
    id: string;
  };
}

export default function ServerEditLayout({
  children,
  params,
}: ServerEditLayoutProps) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Edit Server"
      breadcrumbs={[
        { label: "Servers", href: "/servers" },
        { label: "Edit", href: `/servers/${params.id}/edit` }
      ]}
    >
      {children}
    </AppLayout>
  );
}
