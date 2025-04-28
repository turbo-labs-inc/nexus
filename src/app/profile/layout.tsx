import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | Nexus Platform",
  description: "Manage your user profile and settings",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Profile"
      breadcrumbs={[
        { label: "Profile", href: "/profile" }
      ]}
    >
      {children}
    </AppLayout>
  );
}