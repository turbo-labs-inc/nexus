"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerMonitoringDashboard } from "@/components/servers/server-monitoring";
import { ServerConfigurationManager } from "@/components/servers/server-configuration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function ServerDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("monitoring");
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">MCP Server Dashboard</h1>
      
      <Tabs 
        defaultValue="monitoring" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monitoring" className="space-y-4">
          <ServerMonitoringDashboard />
        </TabsContent>
        
        <TabsContent value="configuration" className="space-y-4">
          <ServerConfigurationManager />
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Server Management</CardTitle>
            <CardDescription>
              Monitor and configure your MCP servers to provide AI capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              This dashboard allows you to:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-500">
              <li>Monitor the health and performance of your MCP servers</li>
              <li>Configure and manage server connections</li>
              <li>View capabilities provided by each server</li>
              <li>Track usage metrics and diagnostics</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}