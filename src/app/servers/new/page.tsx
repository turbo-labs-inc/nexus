import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ServerForm } from "@/components/servers/server-form";
import { MCPProvider } from "@/context/mcp-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add MCP Server | Nexus Platform",
  description: "Add a new MCP server connection",
};

export default async function NewServerPage() {
  // Check authentication
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/auth/login?redirect=/servers/new");
  }

  return (
    <MCPProvider>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Add MCP Server</h1>
        <div className="max-w-3xl mx-auto">
          <ServerForm />
        </div>
      </div>
    </MCPProvider>
  );
}