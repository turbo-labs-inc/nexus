"use client";

import { useState, useEffect } from "react";
import { MCPModel } from "@/lib/mcp/types";
import { useModel } from "@/lib/mcp/hooks/use-model";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, PlusCircle, Edit, Trash2, Zap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ModelCardProps {
  model: MCPModel;
  onEdit: (model: MCPModel) => void;
  onDelete: (modelId: string) => void;
  onSelect: (modelId: string) => void;
  isCurrentModel: boolean;
}

function ModelCard({ model, onEdit, onDelete, onSelect, isCurrentModel }: ModelCardProps) {
  return (
    <Card className={`relative overflow-hidden ${isCurrentModel ? 'border-primary' : 'border'}`}>
      {isCurrentModel && (
        <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground text-xs">
          Current
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{model.name}</CardTitle>
            <CardDescription>
              {model.provider} {model.contextWindow ? `· ${model.contextWindow.toLocaleString()} tokens` : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {model.supportedFeatures && model.supportedFeatures.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Features</p>
              <div className="flex flex-wrap gap-1">
                {model.supportedFeatures.map((feature) => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {model.supportedModalities && model.supportedModalities.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Modalities</p>
              <div className="flex flex-wrap gap-1">
                {model.supportedModalities.map((modality) => (
                  <Badge key={modality} variant="secondary" className="text-xs">
                    {modality}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(model)}
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            
            <div className="space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove model?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the model configuration from your system.
                      Any workflows using this model may stop working.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(model.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                variant="default" 
                size="sm"
                disabled={isCurrentModel}
                onClick={() => onSelect(model.id)}
              >
                <Zap className="h-4 w-4 mr-1" /> {isCurrentModel ? "Current" : "Select"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ModelList() {
  const { models, isExecuting, currentModelId } = useModel();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  
  // Filter models based on search term
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditModel = (model: MCPModel) => {
    router.push(`/models/${model.id}/edit`);
  };

  const handleDeleteModel = (modelId: string) => {
    // This would call a server action to delete the model
    toast.success("Model configuration removed");
  };

  const handleSelectModel = (modelId: string) => {
    // This would set the model as the current model
    toast.success("Model set as current");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Model Configurations</h2>
          <p className="text-muted-foreground">Manage your model configurations and API keys</p>
        </div>
        <Button asChild>
          <Link href="/models/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Model
          </Link>
        </Button>
      </div>
      
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          placeholder="Search models..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredModels.length === 0 ? (
        <div className="text-center py-10">
          {models.length === 0 ? (
            <div className="space-y-3">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-xl font-medium">No models configured</p>
              <p className="text-muted-foreground max-w-md mx-auto">
                Add your first model configuration to start using AI models with your application.
              </p>
              <Button asChild className="mt-4">
                <Link href="/models/new">Add Your First Model</Link>
              </Button>
            </div>
          ) : (
            <p>No models match your search criteria</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              onEdit={handleEditModel}
              onDelete={handleDeleteModel}
              onSelect={handleSelectModel}
              isCurrentModel={model.id === currentModelId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
