import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ServerForm } from "@/components/servers/server-form";
import { MCPProvider } from "@/context/mcp-context";
import { MCPServerConfig } from "@/lib/mcp/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface EditServerPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: EditServerPageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient();

  // Fetch server data
  const { data } = await supabase.from("mcp_configs").select("name").eq("id", params.id).single();

  return {
    title: data ? `Edit ${data.name} | MCP Servers` : "Edit MCP Server | Nexus Platform",
    description: "Edit MCP server configuration",
  };
}

export default async function EditServerPage({ params }: EditServerPageProps) {
  // Check authentication
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect(`/auth/login?redirect=/servers/${params.id}/edit`);
  }

  // Fetch server data
  const { data, error } = await supabase
    .from("mcp_configs")
    .select("*")
    .eq("id", params.id)
    .single();

  // Handle not found
  if (error || !data) {
    notFound();
  }

  // Extract the server config
  const serverConfig = data.config as unknown as MCPServerConfig;

  return (
    <MCPProvider>
      <div className="container mx-auto py-10">
        <div className="mx-auto max-w-3xl">
          <ServerForm initialData={serverConfig} />
        </div>
      </div>
    </MCPProvider>
  );
}
