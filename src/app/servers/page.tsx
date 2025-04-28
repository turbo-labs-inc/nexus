import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ServerList } from "@/components/servers/server-list";
import { MCPProvider } from "@/context/mcp-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "MCP Servers | Nexus Platform",
  description: "Manage your MCP server connections",
};

export default async function ServersPage() {
  try {
    // Check authentication
    const supabase = createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Redirect to login if not authenticated
    if (!session) {
      console.log("No session found, redirecting to login");
      redirect("/auth/login?redirect=/servers");
    }

    console.log("Session found, continuing to servers page");
  } catch (error) {
    console.error("Error checking authentication:", error);
    redirect("/auth/login?redirect=/servers&error=auth_error");
  }

  return (
    <MCPProvider>
      <div className="container mx-auto py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">MCP Servers</h1>
            <p className="text-muted-foreground">Manage your MCP server connections</p>
          </div>
          <Button asChild>
            <Link href="/servers/new">Add Server</Link>
          </Button>
        </div>

        <ServerList />
      </div>
    </MCPProvider>
  );
}
