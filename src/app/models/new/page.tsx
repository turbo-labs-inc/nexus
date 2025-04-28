"use client";

import { ModelForm } from "@/components/models";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createModel } from "@/lib/mcp/actions/model-actions";

export default function NewModelPage() {
  const router = useRouter();
  
  const handleSave = async (data: any) => {
    try {
      // Add the required fields for the model
      const modelData = {
        ...data,
        type: "model",
        description: `${data.provider} ${data.name}`,
        version: "1.0.0",
        schema: {},
        isActive: true
      };
      
      await createModel(modelData);
      return true;
    } catch (error) {
      console.error("Error creating model:", error);
      throw error;
    }
  };
  
  const handleCancel = () => {
    router.push("/models");
  };
  
  return (
    <div className="container py-8">
      <ModelForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
