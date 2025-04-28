"use client";

import { useState } from "react";
import { MCPSlackIntegration } from "@/lib/mcp/types";
import { useSlack } from "@/lib/mcp/hooks/use-slack";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, PlusCircle, Edit, Trash2, Hash } from "lucide-react";
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

interface SlackCardProps {
  integration: MCPSlackIntegration;
  onEdit: (integration: MCPSlackIntegration) => void;
  onDelete: (integrationId: string) => void;
  onToggleStatus: (integrationId: string, isActive: boolean) => void;
}

function SlackCard({ integration, onEdit, onDelete, onToggleStatus }: SlackCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {integration.workspaceName}
              {integration.isActive ? (
                <Badge variant="success" className="text-xs">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Bot: {integration.botName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Channels</p>
            <div className="flex flex-wrap gap-1">
              {integration.channels && integration.channels.length > 0 ? (
                integration.channels.slice(0, 5).map(channel => (
                  <Badge key={channel.id} variant="outline" className="text-xs flex items-center">
                    <Hash className="h-3 w-3 mr-1" />
                    {channel.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No channels configured</span>
              )}
              {integration.channels && integration.channels.length > 5 && (
                <Badge variant="outline" className="text-xs">+{integration.channels.length - 5} more</Badge>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id={`active-${integration.id}`}
                checked={integration.isActive}
                onCheckedChange={(checked) => onToggleStatus(integration.id, checked)}
              />
              <label
                htmlFor={`active-${integration.id}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {integration.isActive ? "Active" : "Inactive"}
              </label>
            </div>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(integration)}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Slack integration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the Slack workspace integration from your system.
                      Any workflows using this integration may stop working.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(integration.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SlackList() {
  const { integrations } = useSlack();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  
  // Filter integrations based on search term
  const filteredIntegrations = integrations.filter(integration => 
    integration.workspaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.botName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditIntegration = (integration: MCPSlackIntegration) => {
    router.push(`/slack/${integration.id}/edit`);
  };

  const handleDeleteIntegration = (integrationId: string) => {
    // This would call a server action to delete the integration
    toast.success("Slack integration removed");
  };

  const handleToggleStatus = (integrationId: string, isActive: boolean) => {
    // This would call a server action to update the integration status
    toast.success(`Slack integration ${isActive ? 'activated' : 'deactivated'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Slack Integrations</h2>
          <p className="text-muted-foreground">Manage your Slack workspace connections</p>
        </div>
        <Button asChild>
          <Link href="/slack/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Workspace
          </Link>
        </Button>
      </div>
      
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          placeholder="Search workspaces..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredIntegrations.length === 0 ? (
        <div className="text-center py-10">
          {integrations.length === 0 ? (
            <div className="space-y-3">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-xl font-medium">No Slack integrations configured</p>
              <p className="text-muted-foreground max-w-md mx-auto">
                Add your first Slack workspace to enable interactions with your channels.
              </p>
              <Button asChild className="mt-4">
                <Link href="/slack/new">Connect Your First Workspace</Link>
              </Button>
            </div>
          ) : (
            <p>No integrations match your search criteria</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map(integration => (
            <SlackCard
              key={integration.id}
              integration={integration}
              onEdit={handleEditIntegration}
              onDelete={handleDeleteIntegration}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
