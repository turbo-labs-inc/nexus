"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MCPModel } from "@/lib/mcp/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const modelSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  provider: z.string().min(2, "Provider name is required"),
  contextWindow: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive(),
  apiConfig: z.object({
    apiKey: z.string().optional(),
    orgId: z.string().optional(),
    endpoint: z.string().optional().or(z.literal("")),
    headers: z.record(z.string()).optional()
  }),
  supportedFeatures: z.array(z.enum([
    "chat",
    "completion",
    "function_calling",
    "vision",
    "embedding",
    "rag",
    "streaming"
  ])),
  supportedModalities: z.array(z.enum([
    "text",
    "image",
    "audio",
    "video"
  ])),
  defaultParameters: z.object({
    temperature: z.number().min(0).max(1).optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(0).max(2).optional(),
    presencePenalty: z.number().min(0).max(2).optional(),
    stopSequences: z.array(z.string()).optional()
  }).optional()
});

type ModelFormValues = z.infer<typeof modelSchema>;

interface ModelFormProps {
  model?: Partial<MCPModel>;
  onSave?: (model: ModelFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function ModelForm({ model, onSave, onCancel }: ModelFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const defaultValues: Partial<ModelFormValues> = {
    name: model?.name || "",
    provider: model?.provider || "",
    contextWindow: model?.contextWindow || 4000,
    maxOutputTokens: model?.maxOutputTokens || 1000,
    apiConfig: model?.apiConfig || {
      apiKey: "",
      orgId: "",
      endpoint: ""
    },
    supportedFeatures: model?.supportedFeatures || ["chat"],
    supportedModalities: model?.supportedModalities || ["text"],
    defaultParameters: model?.defaultParameters || {
      temperature: 0.7,
      topP: 1
    }
  };

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues,
    mode: "onChange"
  });

  const { register, handleSubmit, formState, watch, setValue } = form;
  const { errors } = formState;

  // Helper to toggle array values
  const toggleArrayValue = (field: "supportedFeatures" | "supportedModalities", value: any) => {
    const currentValues = watch(field);
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setValue(field, newValues);
  };

  const onSubmit = async (data: ModelFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (onSave) {
        await onSave(data);
        toast.success("Model configuration saved");
      } else {
        toast.success("Model configuration saved (placeholder)");
      }
      
      // If creating a new model, redirect
      if (!model?.id) {
        router.push("/models");
      }
    } catch (error) {
      console.error("Error saving model:", error);
      toast.error("Failed to save model configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportedFeatures = watch("supportedFeatures");
  const supportedModalities = watch("supportedModalities");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{model?.id ? `Edit ${model.name}` : "Add New Model"}</CardTitle>
          <CardDescription>
            Configure a model to use with your MCP servers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
              <TabsTrigger value="parameters">Default Parameters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Model Name</Label>
                  <Input
                    id="name"
                    placeholder="Claude 3 Opus"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    placeholder="Anthropic"
                    {...register("provider")}
                  />
                  {errors.provider && (
                    <p className="text-sm text-red-500">{errors.provider.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contextWindow">Context Window (tokens)</Label>
                  <Input
                    id="contextWindow"
                    type="number"
                    {...register("contextWindow", { valueAsNumber: true })}
                  />
                  {errors.contextWindow && (
                    <p className="text-sm text-red-500">{errors.contextWindow.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxOutputTokens">Maximum Output Tokens</Label>
                  <Input
                    id="maxOutputTokens"
                    type="number"
                    {...register("maxOutputTokens", { valueAsNumber: true })}
                  />
                  {errors.maxOutputTokens && (
                    <p className="text-sm text-red-500">{errors.maxOutputTokens.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="api" className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    {...register("apiConfig.apiKey")}
                  />
                  <p className="text-sm text-muted-foreground">Your API key will be encrypted and stored securely</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orgId">Organization ID (Optional)</Label>
                  <Input
                    id="orgId"
                    placeholder="org-..."
                    {...register("apiConfig.orgId")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Custom Endpoint (Optional)</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://api.example.com/v1"
                    {...register("apiConfig.endpoint")}
                  />
                  <p className="text-sm text-muted-foreground">Leave empty to use the provider's default endpoint</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="capabilities" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Supported Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "chat", label: "Chat" },
                    { id: "completion", label: "Completion" },
                    { id: "function_calling", label: "Function Calling" },
                    { id: "vision", label: "Vision" },
                    { id: "embedding", label: "Embedding" },
                    { id: "rag", label: "RAG" },
                    { id: "streaming", label: "Streaming" }
                  ].map(feature => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`feature-${feature.id}`}
                        checked={supportedFeatures.includes(feature.id as any)}
                        onCheckedChange={() => toggleArrayValue("supportedFeatures", feature.id)}
                      />
                      <Label htmlFor={`feature-${feature.id}`}>{feature.label}</Label>
                    </div>
                  ))}
                </div>
                
                {supportedFeatures.length === 0 && (
                  <p className="text-sm text-red-500">Select at least one supported feature</p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {supportedFeatures.map(feature => (
                    <Badge key={feature} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Supported Modalities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "text", label: "Text" },
                    { id: "image", label: "Image" },
                    { id: "audio", label: "Audio" },
                    { id: "video", label: "Video" }
                  ].map(modality => (
                    <div key={modality.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`modality-${modality.id}`}
                        checked={supportedModalities.includes(modality.id as any)}
                        onCheckedChange={() => toggleArrayValue("supportedModalities", modality.id)}
                      />
                      <Label htmlFor={`modality-${modality.id}`}>{modality.label}</Label>
                    </div>
                  ))}
                </div>
                
                {supportedModalities.length === 0 && (
                  <p className="text-sm text-red-500">Select at least one supported modality</p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {supportedModalities.map(modality => (
                    <Badge key={modality} variant="secondary">{modality}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="parameters" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      className="w-full"
                      {...register("defaultParameters.temperature", { valueAsNumber: true })}
                    />
                    <span className="text-sm w-12">
                      {watch("defaultParameters.temperature") || 0.7}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="topP">Top P</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="topP"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      className="w-full"
                      {...register("defaultParameters.topP", { valueAsNumber: true })}
                    />
                    <span className="text-sm w-12">
                      {watch("defaultParameters.topP") || 1}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="frequencyPenalty"
                      type="range"
                      min="0"
                      max="2"
                      step="0.01"
                      className="w-full"
                      {...register("defaultParameters.frequencyPenalty", { valueAsNumber: true })}
                    />
                    <span className="text-sm w-12">
                      {watch("defaultParameters.frequencyPenalty") || 0}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="presencePenalty">Presence Penalty</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="presencePenalty"
                      type="range"
                      min="0"
                      max="2"
                      step="0.01"
                      className="w-full"
                      {...register("defaultParameters.presencePenalty", { valueAsNumber: true })}
                    />
                    <span className="text-sm w-12">
                      {watch("defaultParameters.presencePenalty") || 0}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !formState.isValid}>
            {isSubmitting ? "Saving..." : model?.id ? "Update Model" : "Add Model"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
