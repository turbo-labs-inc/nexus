import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Slack Integration | Nexus Platform",
  description: "Manage Slack workspace integrations",
};

export default function SlackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Slack Integration"
      breadcrumbs={[
        { label: "Slack", href: "/slack" }
      ]}
    >
      {children}
    </AppLayout>
  );
}