import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Model | Nexus Platform",
  description: "Edit AI model configuration",
};

interface ModelEditLayoutProps {
  children: React.ReactNode;
  params: {
    id: string;
  };
}

export default function ModelEditLayout({
  children,
  params,
}: ModelEditLayoutProps) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Edit Model"
      breadcrumbs={[
        { label: "AI Models", href: "/models" },
        { label: "Edit", href: `/models/${params.id}/edit` }
      ]}
    >
      {children}
    </AppLayout>
  );
}
