"use client";

import { SlackForm } from "@/components/slack";
import { createSlackIntegration } from "@/lib/mcp/actions/slack-actions";
import { useRouter } from "next/navigation";

export default function NewSlackPage() {
  const router = useRouter();
  
  const handleSave = async (data: any) => {
    try {
      // Add the required fields for a Slack integration
      const integrationData = {
        ...data,
        workspaceId: `W${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };
      
      await createSlackIntegration(integrationData);
      return true;
    } catch (error) {
      console.error("Error creating Slack integration:", error);
      throw error;
    }
  };
  
  const handleCancel = () => {
    router.push("/slack");
  };
  
  return (
    <div className="container py-8">
      <SlackForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
