import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ServerDetail } from "@/components/servers/server-detail";
import { MCPProvider } from "@/context/mcp-context";
import { MCPServerConfig } from "@/lib/mcp/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ServerPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ServerPageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient();

  // Fetch server data
  const { data } = await supabase.from("mcp_configs").select("name").eq("id", params.id).single();

  return {
    title: data ? `${data.name} | MCP Servers` : "MCP Server Details | Nexus Platform",
    description: "View and manage MCP server details",
  };
}

export default async function ServerPage({ params }: ServerPageProps) {
  // Check authentication
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect(`/auth/login?redirect=/servers/${params.id}`);
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
        <ServerDetail server={serverConfig} />
      </div>
    </MCPProvider>
  );
}
