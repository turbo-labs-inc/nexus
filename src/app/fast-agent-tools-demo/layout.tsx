import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fast Agent Tools Demo | Nexus Platform",
  description: "Interactive demo of Fast Agent tools and integrations",
};

export default function FastAgentToolsDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Fast Agent Tools Demo"
      breadcrumbs={[
        { label: "Fast Agent Tools Demo", href: "/fast-agent-tools-demo" }
      ]}
    >
      {children}
    </AppLayout>
  );
}