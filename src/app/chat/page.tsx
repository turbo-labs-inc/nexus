import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChatDemo } from "@/components/chat/chat-demo";

export const metadata: Metadata = {
  title: "Chat | Nexus Platform",
  description: "Multimodal chat interface for Nexus",
};

export default async function ChatPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirect=/chat");
  }

  return (
    <div className="container flex h-[calc(100vh-4rem)] flex-col py-4">
      <h1 className="mb-4 text-3xl font-bold">Chat Interface</h1>
      
      <div className="relative flex flex-1 overflow-hidden rounded-lg border">
        <ChatDemo userId={session.user.id} />
      </div>
    </div>
  );
}