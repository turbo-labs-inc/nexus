"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useMCP } from "@/context/mcp-context";
import { MCPServerConfig } from "@/lib/mcp/types";
import { generateDefaultMCPConfig } from "@/lib/mcp/utils/config-loader";
import { useSupabaseClient } from "@/lib/supabase/client";
import { Json } from "@/lib/supabase/database.types";

// Define form schema
const serverFormSchema = z.object({
  name: z
    .string()
    .min(1, "Server name is required")
    .max(100, "Server name must be 100 characters or less"),
  url: z.string().url("Please enter a valid URL").min(1, "Server URL is required"),
  apiKey: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServerFormValues = z.infer<typeof serverFormSchema>;

interface ServerFormProps {
  initialData?: MCPServerConfig;
  onSuccess?: () => void;
}

export function ServerForm({ initialData, onSuccess }: ServerFormProps) {
  const { registerServer } = useMCP();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useSupabaseClient();

  // Get default values for the form
  const defaultValues: Partial<ServerFormValues> = initialData
    ? {
        name: initialData.name,
        url: initialData.url,
        apiKey: initialData.apiKey,
        description: initialData.description,
        isActive: initialData.isActive,
      }
    : {
        name: "",
        url: "",
        apiKey: "",
        description: "",
        isActive: true,
      };

  // Initialize form
  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues,
  });

  // Form submission handler
  const onSubmit = async (values: ServerFormValues) => {
    setIsSubmitting(true);

    try {
      // Generate a server config
      const serverConfig = initialData
        ? {
            ...initialData,
            name: values.name,
            url: values.url,
            apiKey: values.apiKey,
            description: values.description,
            isActive: values.isActive,
            updatedAt: new Date(),
          }
        : generateDefaultMCPConfig(values.name, values.url);

      // Register the server
      registerServer(serverConfig);

      // Save to Supabase
      const { error } = await supabase.from("mcp_configs").upsert({
        id: serverConfig.id,
        name: serverConfig.name,
        config: serverConfig as unknown as Json, // Cast to Json type
        user_id: null, // This would be set to the current user's ID in a real app
        is_shared: false,
        created_at: serverConfig.createdAt.toISOString(),
        updated_at: serverConfig.updatedAt.toISOString(),
      });

      if (error) {
        throw error;
      }

      // Show success message
      toast.success(initialData ? "Server updated successfully" : "Server created successfully");

      // Redirect or call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/servers");
      }
    } catch (error: any) {
      console.error("Error saving server:", error);
      toast.error("Error saving server: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit MCP Server" : "Add MCP Server"}</CardTitle>
        <CardDescription>
          {initialData
            ? "Update the configuration for this MCP server"
            : "Configure a new MCP server connection"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My MCP Server" {...field} />
                  </FormControl>
                  <FormDescription>A friendly name for this MCP server</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com/mcp" {...field} />
                  </FormControl>
                  <FormDescription>The base URL for the MCP server</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="sk-xxxxxxxxxxxx"
                      type="password"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>API key for authentication (if required)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a description..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>Enable or disable this server</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? initialData
                    ? "Updating..."
                    : "Creating..."
                  : initialData
                    ? "Update Server"
                    : "Add Server"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
