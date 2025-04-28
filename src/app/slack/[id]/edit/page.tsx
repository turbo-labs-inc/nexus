"use client";

import { SlackForm } from "@/components/slack";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MCPSlackIntegration } from "@/lib/mcp/types";
import { getSlackIntegrationById, updateSlackIntegration } from "@/lib/mcp/actions/slack-actions";

interface EditSlackPageProps {
  params: {
    id: string;
  };
}

export default function EditSlackPage({ params }: EditSlackPageProps) {
  const router = useRouter();
  const [integration, setIntegration] = useState<MCPSlackIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadIntegration() {
      try {
        const fetchedIntegration = await getSlackIntegrationById(params.id);
        
        if (fetchedIntegration) {
          setIntegration(fetchedIntegration);
        } else {
          // Fallback to mock data when database isn't set up
          const mockIntegration: MCPSlackIntegration = {
            id: params.id,
            type: "slack",
            name: "Demo Workspace",
            description: "Demo Slack workspace",
            version: "1.0.0",
            schema: {},
            serverId: "local",
            isActive: true,
            workspaceId: "W12345",
            workspaceName: "Demo Company",
            botName: "NexusBot",
            channels: [
              { id: "C01", name: "general", isPrivate: false },
              { id: "C02", name: "random", isPrivate: false },
              { id: "C03", name: "dev", isPrivate: false }
            ],
            apiConfig: {
              botToken: "xoxb-...",
              signingSecret: "...",
              appId: "A...",
              clientId: "...",
              clientSecret: "...",
              verificationToken: "..."
            },
            authConfig: {
              scopes: ["channels:history", "chat:write"],
              redirectUri: "",
              installationStore: ""
            }
          };
          
          setIntegration(mockIntegration);
        }
      } catch (error) {
        console.error("Error loading Slack integration:", error);
        toast.error("Failed to load Slack integration");
        router.push("/slack");
      } finally {
        setLoading(false);
      }
    }
    
    loadIntegration();
  }, [params.id, router]);
  
  const handleSave = async (data: any) => {
    try {
      if (!integration) throw new Error("No integration to update");
      
      // Preserve fields that shouldn't be modified by the form
      await updateSlackIntegration(params.id, data);
      return true;
    } catch (error) {
      console.error("Error updating Slack integration:", error);
      throw error;
    }
  };
  
  const handleCancel = () => {
    router.push("/slack");
  };
  
  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!integration) return null;
  
  return (
    <div className="container py-8">
      <SlackForm integration={integration} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
