import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workflow Designer | Nexus Platform",
  description: "Design and manage AI workflows",
};

export default function WorkflowDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Workflow Designer"
      breadcrumbs={[
        { label: "Workflow Designer", href: "/workflow-demo" }
      ]}
    >
      {children}
    </AppLayout>
  );
}