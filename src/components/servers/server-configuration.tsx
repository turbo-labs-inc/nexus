"use client";

import React, { useState } from "react";
import { useMCP } from "@/context/mcp-context";
import { MCPServerConfig } from "@/lib/mcp/types";
import { logger } from "@/lib/mcp/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Trash2, Save, RefreshCw, Power, InfoIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface ServerFormData {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  description?: string;
  isActive: boolean;
  capabilities: any[];
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  capabilitiesFound?: number;
}

export function ServerConfigurationManager() {
  const { servers, registerServer, unregisterServer } = useMCP();
  const { toast } = useToast();
  
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  
  const [formData, setFormData] = useState<ServerFormData>({
    id: "",
    name: "",
    url: "",
    apiKey: "",
    description: "",
    isActive: true,
    capabilities: []
  });
  
  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      url: "",
      apiKey: "",
      description: "",
      isActive: true,
      capabilities: []
    });
    setTestResult(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isActive: checked
    });
  };
  
  const openAddServerDialog = () => {
    resetForm();
    setFormData({
      ...formData,
      id: uuidv4()
    });
    setIsAddServerOpen(true);
  };
  
  const openEditServerDialog = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;
    
    setFormData({
      id: server.id,
      name: server.name,
      url: server.url,
      apiKey: server.apiKey || "",
      description: server.description || "",
      isActive: server.isActive,
      capabilities: server.capabilities || []
    });
    
    setIsAddServerOpen(true);
  };
  
  const handleDeleteServer = (serverId: string) => {
    setServerToDelete(serverId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteServer = async () => {
    if (!serverToDelete) return;
    
    try {
      logger.info(`Deleting server: ${serverToDelete}`, undefined, serverToDelete, "server-config");
      
      // Delete from API
      const response = await fetch(`/api/mcp/servers/${serverToDelete}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting server: ${response.statusText}`);
      }
      
      // Remove from local state
      unregisterServer(serverToDelete);
      
      toast({
        title: "Server deleted",
        description: "The server has been successfully deleted.",
      });
    } catch (error) {
      logger.error(`Error deleting server: ${serverToDelete}`, { error }, serverToDelete, "server-config");
      
      toast({
        title: "Error deleting server",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setServerToDelete(null);
    }
  };
  
  const handleTestConnection = async () => {
    if (!formData.url) {
      toast({
        title: "Validation error",
        description: "Please enter a server URL",
        variant: "destructive"
      });
      return;
    }
    
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      logger.info(`Testing connection to server: ${formData.url}`, undefined, formData.id, "server-config");
      
      // Make request to test endpoint
      const response = await fetch("/api/mcp/servers/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: formData.url,
          apiKey: formData.apiKey
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Connection test failed");
      }
      
      const data = await response.json();
      
      setTestResult({
        success: true,
        message: "Connection successful!",
        capabilitiesFound: data.capabilities?.length || 0
      });
      
      toast({
        title: "Connection successful",
        description: `Found ${data.capabilities?.length || 0} capabilities on the server.`
      });
    } catch (error) {
      logger.error(`Connection test failed for: ${formData.url}`, { error }, formData.id, "server-config");
      
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed"
      });
      
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Connection test failed",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const handleSubmitServer = async () => {
    // Validate form
    if (!formData.name || !formData.url) {
      toast({
        title: "Validation error",
        description: "Name and URL are required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const isNewServer = !servers.some(s => s.id === formData.id);
      logger.info(
        `${isNewServer ? "Creating" : "Updating"} server: ${formData.name}`,
        { id: formData.id, url: formData.url },
        formData.id,
        "server-config"
      );
      
      // Create server config
      const serverConfig: MCPServerConfig = {
        id: formData.id,
        name: formData.name,
        url: formData.url,
        apiKey: formData.apiKey || undefined,
        description: formData.description,
        capabilities: formData.capabilities || [],
        isActive: formData.isActive,
        status: "unknown",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to API
      const response = await fetch("/api/mcp/servers", {
        method: isNewServer ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(serverConfig)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${isNewServer ? "creating" : "updating"} server`);
      }
      
      // Update local state
      registerServer(serverConfig);
      
      toast({
        title: isNewServer ? "Server created" : "Server updated",
        description: `The server has been successfully ${isNewServer ? "created" : "updated"}.`
      });
      
      // Close dialog
      setIsAddServerOpen(false);
    } catch (error) {
      logger.error(
        `Error ${formData.id ? "updating" : "creating"} server`,
        { error, server: formData },
        formData.id,
        "server-config"
      );
      
      toast({
        title: `Error ${formData.id ? "updating" : "creating"} server`,
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Server Configuration</h2>
        <Button onClick={openAddServerDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Server
        </Button>
      </div>
      
      {/* Server List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {servers.map((server) => (
          <Card key={server.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                {server.name}
              </CardTitle>
              <CardDescription>{server.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="mr-2 font-medium">URL:</span>
                  <span className="truncate text-gray-500">{server.url}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 font-medium">Capabilities:</span>
                  <span className="text-gray-500">{server.capabilities.length}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 font-medium">Status:</span>
                  <span className="capitalize text-gray-500">{server.status}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditServerDialog(server.id)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteServer(server.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {servers.length === 0 && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No Servers Configured</CardTitle>
              <CardDescription>
                Add your first MCP server to begin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <InfoIcon className="h-12 w-12 text-gray-300" />
                <p className="text-gray-500">
                  MCP servers provide tools, resources, and prompts for your AI applications.
                </p>
                <Button onClick={openAddServerDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Server
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Add/Edit Server Dialog */}
      <Dialog open={isAddServerOpen} onOpenChange={setIsAddServerOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Edit Server" : "Add Server"}
            </DialogTitle>
            <DialogDescription>
              Configure an MCP server to provide AI capabilities to your application.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="My MCP Server"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right">
                    URL
                  </Label>
                  <div className="col-span-3 flex space-x-2">
                    <Input
                      id="url"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      placeholder="https://mcp-server.example.com"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection || !formData.url}
                    >
                      {isTestingConnection ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Test
                    </Button>
                  </div>
                </div>
                
                {testResult && (
                  <div className="col-span-3 col-start-2">
                    <div
                      className={`rounded p-2 text-sm ${
                        testResult.success
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {testResult.message}
                      {testResult.success && testResult.capabilitiesFound !== undefined && (
                        <div className="mt-1">
                          Found {testResult.capabilitiesFound} capabilities on the server.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apiKey" className="text-right">
                    API Key
                  </Label>
                  <Input
                    id="apiKey"
                    name="apiKey"
                    value={formData.apiKey}
                    onChange={handleInputChange}
                    placeholder="API Key (optional)"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Server description"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    Active
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={handleSwitchChange}
                    />
                    <Label htmlFor="isActive">
                      {formData.isActive ? "Server is active" : "Server is inactive"}
                    </Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="rounded border p-4">
                  <h3 className="mb-2 font-medium">Advanced Settings</h3>
                  <p className="text-sm text-gray-500">
                    Advanced settings are under development and will be available soon.
                  </p>
                </div>
                
                <div className="rounded border p-4">
                  <h3 className="mb-2 font-medium">Server Capabilities</h3>
                  <p className="text-sm text-gray-500">
                    {formData.capabilities.length === 0 
                      ? "No capabilities configured for this server." 
                      : `${formData.capabilities.length} capabilities configured.`
                    }
                  </p>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" disabled>
                      Manage Capabilities
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddServerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitServer}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this server? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteServer}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}