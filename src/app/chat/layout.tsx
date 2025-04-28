import { AppLayout } from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat | Nexus Platform",
  description: "Interactive chat interface with AI models",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      showSidebar={true} 
      title="Chat"
      breadcrumbs={[
        { label: "Chat", href: "/chat" }
      ]}
    >
      {children}
    </AppLayout>
  );
}