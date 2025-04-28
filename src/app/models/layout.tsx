import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Models | Nexus Platform",
  description: "Manage AI models and configurations",
};

export default function ModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="AI Models"
      breadcrumbs={[
        { label: "AI Models", href: "/models" }
      ]}
    >
      {children}
    </AppLayout>
  );
}