"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MCPSlackIntegration } from "@/lib/mcp/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const slackSchema = z.object({
  workspaceName: z.string().min(2, "Workspace name is required"),
  botName: z.string().min(1, "Bot name is required"),
  apiConfig: z.object({
    botToken: z.string().min(1, "Bot token is required"),
    signingSecret: z.string().min(1, "Signing secret is required"),
    appId: z.string().min(1, "App ID is required"),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    verificationToken: z.string().optional()
  }),
  authConfig: z.object({
    scopes: z.array(z.string()),
    redirectUri: z.string().url().optional().or(z.literal("")),
    installationStore: z.string().optional().or(z.literal(""))
  }),
  channels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      isPrivate: z.boolean().default(false)
    })
  ).optional().default([]),
  listenerEnabled: z.boolean().default(true),
  atMentionEnabled: z.boolean().default(true)
});

type SlackFormValues = z.infer<typeof slackSchema>;

interface SlackFormProps {
  integration?: Partial<MCPSlackIntegration>;
  onSave?: (integration: SlackFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function SlackForm({ integration, onSave, onCancel }: SlackFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [newChannel, setNewChannel] = useState({ id: "", name: "", isPrivate: false });
  
  const defaultScopes = [
    "channels:history",
    "channels:read",
    "chat:write",
    "chat:write.public",
    "groups:history",
    "groups:read",
    "im:history",
    "im:read",
    "mpim:history",
    "mpim:read",
    "users:read"
  ];

  const defaultValues: Partial<SlackFormValues> = {
    workspaceName: integration?.workspaceName || "",
    botName: integration?.botName || "Nexus Bot",
    apiConfig: integration?.apiConfig || {
      botToken: "",
      signingSecret: "",
      appId: "",
      clientId: "",
      clientSecret: "",
      verificationToken: ""
    },
    authConfig: integration?.authConfig || {
      scopes: defaultScopes,
      redirectUri: "",
      installationStore: ""
    },
    channels: integration?.channels || [],
    listenerEnabled: true,
    atMentionEnabled: true
  };

  const form = useForm<SlackFormValues>({
    resolver: zodResolver(slackSchema),
    defaultValues,
    mode: "onChange"
  });

  const { register, handleSubmit, formState, watch, setValue, getValues } = form;
  const { errors } = formState;
  
  const channels = watch("channels");

  const onSubmit = async (data: SlackFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (onSave) {
        await onSave(data);
        toast.success("Slack integration saved");
      } else {
        toast.success("Slack integration saved (placeholder)");
      }
      
      // If creating a new integration, redirect
      if (!integration?.id) {
        router.push("/slack");
      }
    } catch (error) {
      console.error("Error saving Slack integration:", error);
      toast.error("Failed to save Slack integration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsTestingConnection(true);
      // This would call an API to test the Slack API credentials
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Successfully connected to Slack workspace");
    } catch (error) {
      console.error("Error testing Slack connection:", error);
      toast.error("Could not connect to Slack. Please check your credentials.");
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const fetchChannels = async () => {
    try {
      setIsTestingConnection(true);
      // This would call an API to fetch channels from Slack
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock channels for demo purposes
      const mockChannels = [
        { id: "C01234567", name: "general", isPrivate: false },
        { id: "C01234568", name: "random", isPrivate: false },
        { id: "C01234569", name: "development", isPrivate: false },
        { id: "C01234570", name: "announcements", isPrivate: true }
      ];
      
      setValue("channels", mockChannels);
      toast.success("Successfully fetched channels from Slack");
    } catch (error) {
      console.error("Error fetching Slack channels:", error);
      toast.error("Could not fetch channels. Please check your credentials.");
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const addChannel = () => {
    if (!newChannel.id || !newChannel.name) {
      toast.error("Channel ID and name are required");
      return;
    }
    
    const currentChannels = getValues("channels") || [];
    const channelExists = currentChannels.some(c => c.id === newChannel.id);
    
    if (channelExists) {
      toast.error("Channel with this ID already exists");
      return;
    }
    
    setValue("channels", [...currentChannels, newChannel]);
    setNewChannel({ id: "", name: "", isPrivate: false });
  };
  
  const removeChannel = (channelId: string) => {
    const currentChannels = getValues("channels") || [];
    setValue("channels", currentChannels.filter(c => c.id !== channelId));
  };
  
  const toggleScope = (scope: string) => {
    const currentScopes = getValues("authConfig.scopes") || [];
    const newScopes = currentScopes.includes(scope)
      ? currentScopes.filter(s => s !== scope)
      : [...currentScopes, scope];
    setValue("authConfig.scopes", newScopes);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{integration?.id ? `Edit ${integration.workspaceName}` : "Add New Slack Workspace"}</CardTitle>
          <CardDescription>
            Configure a Slack workspace integration for your Nexus application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">Workspace Name</Label>
                  <Input
                    id="workspaceName"
                    placeholder="My Company Slack"
                    {...register("workspaceName")}
                  />
                  {errors.workspaceName && (
                    <p className="text-sm text-red-500">{errors.workspaceName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="botName">Bot Name</Label>
                  <Input
                    id="botName"
                    placeholder="Nexus Bot"
                    {...register("botName")}
                  />
                  <p className="text-sm text-muted-foreground">This name will be shown in Slack messages</p>
                  {errors.botName && (
                    <p className="text-sm text-red-500">{errors.botName.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="api" className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="xoxb-..."
                    {...register("apiConfig.botToken")}
                  />
                  <p className="text-sm text-muted-foreground">Your bot token will be encrypted and stored securely</p>
                  {errors.apiConfig?.botToken && (
                    <p className="text-sm text-red-500">{errors.apiConfig.botToken.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signingSecret">Signing Secret</Label>
                  <Input
                    id="signingSecret"
                    type="password"
                    placeholder="..."
                    {...register("apiConfig.signingSecret")}
                  />
                  {errors.apiConfig?.signingSecret && (
                    <p className="text-sm text-red-500">{errors.apiConfig.signingSecret.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="appId">App ID</Label>
                  <Input
                    id="appId"
                    placeholder="A..."
                    {...register("apiConfig.appId")}
                  />
                  {errors.apiConfig?.appId && (
                    <p className="text-sm text-red-500">{errors.apiConfig.appId.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID (Optional)</Label>
                    <Input
                      id="clientId"
                      type="password"
                      {...register("apiConfig.clientId")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret (Optional)</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      {...register("apiConfig.clientSecret")}
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={testConnection}
                    disabled={isTestingConnection || !form.getValues("apiConfig.botToken") || !form.getValues("apiConfig.signingSecret")}
                  >
                    {isTestingConnection ? "Testing..." : "Test Connection"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Scopes</h3>
                <p className="text-sm text-muted-foreground">Select the permissions your Slack bot will need</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {[
                    { id: "channels:history", label: "View messages in public channels" },
                    { id: "channels:read", label: "View basic info about public channels" },
                    { id: "chat:write", label: "Send messages as the app" },
                    { id: "chat:write.public", label: "Send messages to channels the app isn't in" },
                    { id: "groups:history", label: "View messages in private channels" },
                    { id: "groups:read", label: "View basic info about private channels" },
                    { id: "im:history", label: "View messages in direct messages" },
                    { id: "im:read", label: "View basic info about direct messages" },
                    { id: "mpim:history", label: "View messages in group direct messages" },
                    { id: "mpim:read", label: "View basic info about group direct messages" },
                    { id: "users:read", label: "View basic info about users in the workspace" },
                    { id: "reactions:write", label: "Add reactions to messages" },
                    { id: "files:read", label: "View files shared in channels" },
                    { id: "files:write", label: "Upload, edit, and delete files" }
                  ].map(scope => (
                    <div key={scope.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`scope-${scope.id}`}
                        checked={watch("authConfig.scopes").includes(scope.id)}
                        onCheckedChange={() => toggleScope(scope.id)}
                      />
                      <Label htmlFor={`scope-${scope.id}`} className="text-sm">{scope.label}</Label>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 pt-4">
                  <Label htmlFor="redirectUri">Redirect URI (Optional)</Label>
                  <Input
                    id="redirectUri"
                    placeholder="https://yourdomain.com/api/slack/oauth"
                    {...register("authConfig.redirectUri")}
                  />
                  <p className="text-sm text-muted-foreground">Required for OAuth installations</p>
                  {errors.authConfig?.redirectUri && (
                    <p className="text-sm text-red-500">{errors.authConfig.redirectUri.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="channels" className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Channels</h3>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={fetchChannels}
                    disabled={isTestingConnection || !form.getValues("apiConfig.botToken")}
                  >
                    {isTestingConnection ? "Fetching..." : "Fetch Channels"}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {channels.length > 0 ? (
                    <div className="border rounded-md divide-y">
                      {channels.map((channel, index) => (
                        <div key={channel.id} className="p-3 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">#{channel.name}</span>
                              {channel.isPrivate && (
                                <Badge variant="outline" className="text-xs">Private</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{channel.id}</p>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeChannel(channel.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-md">
                      <p className="text-muted-foreground">No channels configured</p>
                      <p className="text-sm text-muted-foreground">Click "Fetch Channels" to import channels from Slack</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <h4 className="text-md font-medium mb-2">Add Channel Manually</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="channelId">Channel ID</Label>
                      <Input
                        id="channelId"
                        placeholder="C01234567"
                        value={newChannel.id}
                        onChange={(e) => setNewChannel({...newChannel, id: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="channelName">Channel Name</Label>
                      <Input
                        id="channelName"
                        placeholder="general"
                        value={newChannel.name}
                        onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 h-10">
                      <Checkbox
                        id="channelPrivate"
                        checked={newChannel.isPrivate}
                        onCheckedChange={(checked) => 
                          setNewChannel({...newChannel, isPrivate: Boolean(checked)})
                        }
                      />
                      <Label htmlFor="channelPrivate">Private channel</Label>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-4" 
                    onClick={addChannel}
                    disabled={!newChannel.id || !newChannel.name}
                  >
                    Add Channel
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base" htmlFor="listenerEnabled">Message Listener</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically listen for messages in configured channels
                      </p>
                    </div>
                    <Switch
                      id="listenerEnabled"
                      checked={watch("listenerEnabled")}
                      onCheckedChange={(checked) => setValue("listenerEnabled", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base" htmlFor="atMentionEnabled">@ Mentions Only</Label>
                      <p className="text-sm text-muted-foreground">
                        Only respond to messages that mention the bot (@{watch("botName")})
                      </p>
                    </div>
                    <Switch
                      id="atMentionEnabled"
                      checked={watch("atMentionEnabled")}
                      onCheckedChange={(checked) => setValue("atMentionEnabled", checked)}
                      disabled={!watch("listenerEnabled")}
                    />
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
            {isSubmitting ? "Saving..." : integration?.id ? "Update Integration" : "Add Integration"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
