"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMCP } from "@/context/mcp-context";
import { metrics, MetricType } from "@/lib/mcp/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, HelpCircle, Play, Square } from "lucide-react";

interface ServerMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  toolsExecuted: number;
  resourcesQueried: number;
  promptsRendered: number;
  lastUpdated: Date;
}

export function ServerMonitoringDashboard() {
  const { servers, serverStatuses, connectToServer, disconnectFromServer } = useMCP();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [serverMetrics, setServerMetrics] = useState<Record<string, ServerMetrics>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Select the first server by default
  useEffect(() => {
    if (servers.length > 0 && !selectedServerId) {
      setSelectedServerId(servers[0].id);
    }
  }, [servers, selectedServerId]);

  // Update metrics every 15 seconds
  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics: Record<string, ServerMetrics> = {};
      
      servers.forEach(server => {
        // Calculate core metrics for each server
        const requestsPerMinute = 
          metrics.getCounter(MetricType.API_REQUEST_COUNT, server.id) / 
          ((metrics.getCounter(MetricType.SERVER_UPTIME, server.id) || 1) / 60000);
          
        const histogramStats = metrics.getHistogramStats(
          MetricType.TOOL_EXECUTION_TIME, 
          server.id
        );
        
        const toolsExecuted = metrics.getCounter(
          MetricType.TOOL_EXECUTION_COUNT, 
          server.id
        );
        
        const resourcesQueried = metrics.getCounter(
          MetricType.RESOURCE_QUERY_COUNT, 
          server.id
        );
        
        const promptsRendered = metrics.getCounter(
          MetricType.PROMPT_RENDERING_COUNT, 
          server.id
        );
        
        const errorCount = metrics.getCounter(
          MetricType.ERROR_COUNT, 
          server.id
        );
        
        const totalOperations = toolsExecuted + resourcesQueried + promptsRendered;
        const errorRate = totalOperations > 0 ? (errorCount / totalOperations) * 100 : 0;
        
        newMetrics[server.id] = {
          requestsPerMinute,
          averageResponseTime: histogramStats.avg || 0,
          errorRate,
          uptime: metrics.getCounter(MetricType.SERVER_UPTIME, server.id) || 0,
          toolsExecuted,
          resourcesQueried,
          promptsRendered,
          lastUpdated: new Date(),
        };
      });
      
      setServerMetrics(newMetrics);
    };
    
    // Initial update
    updateMetrics();
    
    // Set up interval
    const interval = setInterval(updateMetrics, 15000);
    
    return () => clearInterval(interval);
  }, [servers]);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    
    try {
      // Collect statuses from all servers
      await Promise.all(
        servers.map(async (server) => {
          const response = await fetch(`/api/mcp/servers/${server.id}/status`);
          return response.json();
        })
      );
      
      // Update metrics
      const newMetrics: Record<string, ServerMetrics> = { ...serverMetrics };
      
      servers.forEach(server => {
        if (newMetrics[server.id]) {
          newMetrics[server.id] = {
            ...newMetrics[server.id],
            lastUpdated: new Date()
          };
        }
      });
      
      setServerMetrics(newMetrics);
    } catch (error) {
      console.error("Error refreshing metrics:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnectServer = async (serverId: string) => {
    try {
      await connectToServer(serverId);
    } catch (error) {
      console.error(`Error connecting to server ${serverId}:`, error);
    }
  };

  const handleDisconnectServer = async (serverId: string) => {
    try {
      await disconnectFromServer(serverId);
    } catch (error) {
      console.error(`Error disconnecting from server ${serverId}:`, error);
    }
  };

  // Generate chart data for the selected server
  const chartData = useMemo(() => {
    if (!selectedServerId) return [];
    
    // Generate some sample data for demonstration
    // In a real implementation, this would come from historical metrics
    const now = new Date();
    const timestamps = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now);
      date.setMinutes(now.getMinutes() - (11 - i) * 5);
      return date;
    });
    
    return timestamps.map((timestamp, index) => {
      // Simulate some variability in metrics
      const requestBase = (serverMetrics[selectedServerId]?.requestsPerMinute || 10) * 0.8;
      const responseBase = (serverMetrics[selectedServerId]?.averageResponseTime || 500) * 0.8;
      const errorBase = (serverMetrics[selectedServerId]?.errorRate || 1) * 0.8;
      
      const variability = (index / 11) * 0.4 + 0.8; // Values from 0.8 to 1.2
      
      return {
        time: timestamp.toLocaleTimeString(),
        requests: Math.round(requestBase * variability),
        responseTime: Math.round(responseBase * variability),
        errorRate: parseFloat((errorBase * variability).toFixed(2)),
      };
    });
  }, [selectedServerId, serverMetrics]);

  // Get status for the selected server
  const selectedServerStatus = useMemo(() => {
    if (!selectedServerId) return null;
    return serverStatuses.find(status => status.serverId === selectedServerId);
  }, [selectedServerId, serverStatuses]);

  // Get metrics for the selected server
  const selectedServerMetrics = useMemo(() => {
    if (!selectedServerId) return null;
    return serverMetrics[selectedServerId];
  }, [selectedServerId, serverMetrics]);

  // Handle server status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="mr-1 h-3 w-3" />
            Online
          </Badge>
        );
      case "offline":
        return (
          <Badge className="bg-gray-500 text-white">
            <XCircle className="mr-1 h-3 w-3" />
            Offline
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500 text-white">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500 text-white">
            <HelpCircle className="mr-1 h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  // Format time for display
  const formatUptime = (milliseconds: number) => {
    if (milliseconds < 1000) return "< 1 second";
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Server Monitoring</h2>
        <Button 
          variant="outline"
          onClick={refreshMetrics}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Server List */}
        <div className="space-y-4 md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">MCP Servers</CardTitle>
              <CardDescription>
                {servers.length} server{servers.length !== 1 ? "s" : ""} registered
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[50vh] overflow-y-auto">
              <div className="space-y-2">
                {servers.map((server) => {
                  const status = serverStatuses.find(s => s.serverId === server.id);
                  
                  return (
                    <div 
                      key={server.id}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        selectedServerId === server.id 
                          ? "border-primary bg-muted" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedServerId(server.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{server.name}</div>
                        {status && getStatusDisplay(status.status)}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{server.description || "No description"}</div>
                    </div>
                  );
                })}
                
                {servers.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <p>No servers registered</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Register Server
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard */}
        <div className="space-y-4 md:col-span-3">
          {!selectedServerId ? (
            <div className="flex h-[50vh] items-center justify-center rounded-lg border">
              <div className="text-center text-gray-500">
                <p>Select a server to view metrics</p>
              </div>
            </div>
          ) : (
            <>
              {/* Server Overview */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
                    <div>
                      <CardTitle>
                        {servers.find(s => s.id === selectedServerId)?.name || "Server"}
                      </CardTitle>
                      <CardDescription>
                        {servers.find(s => s.id === selectedServerId)?.description || "No description"}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      {selectedServerStatus?.status === "offline" ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleConnectServer(selectedServerId)}
                        >
                          <Play className="mr-1 h-4 w-4" />
                          Connect
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDisconnectServer(selectedServerId)}
                        >
                          <Square className="mr-1 h-4 w-4" />
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="flex items-center">
                          {selectedServerStatus 
                            ? getStatusDisplay(selectedServerStatus.status)
                            : "Unknown"
                          }
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Last checked: {selectedServerStatus?.lastChecked 
                            ? new Date(selectedServerStatus.lastChecked).toLocaleTimeString() 
                            : "Never"
                          }
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm font-medium text-gray-500">Uptime</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">
                          {selectedServerMetrics 
                            ? formatUptime(selectedServerMetrics.uptime)
                            : "N/A"
                          }
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Since last connection
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm font-medium text-gray-500">Requests</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">
                          {selectedServerMetrics
                            ? Math.round(selectedServerMetrics.requestsPerMinute)
                            : "0"
                          }/min
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Avg response time: {selectedServerMetrics
                            ? Math.round(selectedServerMetrics.averageResponseTime)
                            : "0"
                          }ms
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm font-medium text-gray-500">Error Rate</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">
                          {selectedServerMetrics
                            ? selectedServerMetrics.errorRate.toFixed(1)
                            : "0"
                          }%
                        </div>
                        <Progress 
                          value={selectedServerMetrics?.errorRate || 0}
                          max={100}
                          className="mt-2 h-1"
                          indicatorClassName={
                            (selectedServerMetrics?.errorRate || 0) > 5
                              ? "bg-red-500"
                              : (selectedServerMetrics?.errorRate || 0) > 2
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }
                        />
                      </CardContent>
                    </Card>
                  </div>
                  
                  {selectedServerStatus?.status === "error" && selectedServerStatus.errorMessage && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {selectedServerStatus.errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              {/* Tabs for Metrics */}
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Metrics Overview</CardTitle>
                      <CardDescription>
                        Real-time metrics for the selected server
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="requests" 
                              stroke="#8884d8" 
                              name="Requests/min"
                            />
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="responseTime" 
                              stroke="#82ca9d" 
                              name="Avg Response Time (ms)"
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="errorRate" 
                              stroke="#ff8042" 
                              name="Error Rate (%)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter className="text-xs text-gray-500">
                      Last updated: {selectedServerMetrics
                        ? selectedServerMetrics.lastUpdated.toLocaleTimeString()
                        : "Never"
                      }
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="capabilities">
                  <Card>
                    <CardHeader>
                      <CardTitle>Server Capabilities</CardTitle>
                      <CardDescription>
                        Operations executed on this server
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardHeader className="p-3 pb-0">
                            <CardTitle className="text-sm font-medium text-gray-500">Tools Executed</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-bold">
                              {selectedServerMetrics?.toolsExecuted || 0}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="p-3 pb-0">
                            <CardTitle className="text-sm font-medium text-gray-500">Resources Queried</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-bold">
                              {selectedServerMetrics?.resourcesQueried || 0}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="p-3 pb-0">
                            <CardTitle className="text-sm font-medium text-gray-500">Prompts Rendered</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-bold">
                              {selectedServerMetrics?.promptsRendered || 0}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="mt-4">
                        <Button variant="outline" className="w-full">
                          View Detailed Capability Stats
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="performance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Analysis</CardTitle>
                      <CardDescription>
                        Response times and throughput stats
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="italic text-gray-500">
                        Performance analysis metrics will be available soon. This feature is under development.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}