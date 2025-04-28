"use client";

import { ModelForm } from "@/components/models";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MCPModel } from "@/lib/mcp/types";
import { getModelById, updateModel } from "@/lib/mcp/actions/model-actions";

interface EditModelPageProps {
  params: {
    id: string;
  };
}

export default function EditModelPage({ params }: EditModelPageProps) {
  const router = useRouter();
  const [model, setModel] = useState<MCPModel | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadModel() {
      try {
        const fetchedModel = await getModelById(params.id);
        
        if (fetchedModel) {
          setModel(fetchedModel);
        } else {
          toast.error("Model not found");
          router.push("/models");
        }
      } catch (error) {
        console.error("Error loading model:", error);
        toast.error("Failed to load model");
        router.push("/models");
      } finally {
        setLoading(false);
      }
    }
    
    loadModel();
  }, [params.id, router]);
  
  const handleSave = async (data: any) => {
    try {
      if (!model) throw new Error("No model to update");
      
      // Preserve fields that shouldn't be modified by the form
      const modelData = {
        ...data,
        type: "model",
        description: `${data.provider} ${data.name}`,
        version: model.version,
        schema: model.schema,
        isActive: model.isActive
      };
      
      await updateModel(params.id, modelData);
      return true;
    } catch (error) {
      console.error("Error updating model:", error);
      throw error;
    }
  };
  
  const handleCancel = () => {
    router.push("/models");
  };
  
  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!model) return null;
  
  return (
    <div className="container py-8">
      <ModelForm model={model} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
