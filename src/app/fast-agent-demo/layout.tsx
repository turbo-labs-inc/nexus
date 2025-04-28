import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fast Agent Demo | Nexus Platform",
  description: "Interactive demo of the Fast Agent capabilities",
};

export default function FastAgentDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Fast Agent Demo"
      breadcrumbs={[
        { label: "Fast Agent Demo", href: "/fast-agent-demo" }
      ]}
    >
      {children}
    </AppLayout>
  );
}