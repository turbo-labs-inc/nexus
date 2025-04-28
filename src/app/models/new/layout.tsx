import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Model | Nexus Platform",
  description: "Create a new AI model configuration",
};

export default function NewModelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="New Model"
      breadcrumbs={[
        { label: "AI Models", href: "/models" },
        { label: "New", href: "/models/new" }
      ]}
    >
      {children}
    </AppLayout>
  );
}
