import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Model Details | Nexus Platform",
  description: "AI model details and configuration",
};

interface ModelDetailLayoutProps {
  children: React.ReactNode;
  params: {
    id: string;
  };
}

export default function ModelDetailLayout({
  children,
  params,
}: ModelDetailLayoutProps) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Model Details"
      breadcrumbs={[
        { label: "AI Models", href: "/models" },
        { label: "Details", href: `/models/${params.id}` }
      ]}
    >
      {children}
    </AppLayout>
  );
}
