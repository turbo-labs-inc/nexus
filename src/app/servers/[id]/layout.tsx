import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Server Details | Nexus Platform",
  description: "MCP server details and configuration",
};

interface ServerDetailLayoutProps {
  children: React.ReactNode;
  params: {
    id: string;
  };
}

export default function ServerDetailLayout({
  children,
  params,
}: ServerDetailLayoutProps) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Server Details"
      breadcrumbs={[
        { label: "Servers", href: "/servers" },
        { label: "Details", href: `/servers/${params.id}` }
      ]}
    >
      {children}
    </AppLayout>
  );
}
