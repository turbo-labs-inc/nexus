import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Nexus Platform",
  description: "Nexus Platform Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Dashboard"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" }
      ]}
    >
      {children}
    </AppLayout>
  );
}