"use client";

import { useState, useEffect } from "react";
import { MCPServerStatus } from "../types";
import { useMCP } from "@/context/mcp-context";

/**
 * Hook to monitor a specific server's status
 */
export function useServerStatus(serverId: string): {
  status: "online" | "offline" | "error" | "unknown";
  isOnline: boolean;
  isOffline: boolean;
  isError: boolean;
  isUnknown: boolean;
  lastChecked: Date | null;
  errorMessage: string | undefined;
} {
  const { getServerStatus } = useMCP();
  const [serverStatus, setServerStatus] = useState<MCPServerStatus | undefined>(
    getServerStatus(serverId)
  );
  
  // Update status when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getServerStatus(serverId);
      if (status) {
        // Only update if something changed to avoid unnecessary re-renders
        if (!serverStatus || 
            status.status !== serverStatus.status || 
            status.lastChecked !== serverStatus.lastChecked ||
            status.errorMessage !== serverStatus.errorMessage) {
          setServerStatus(status);
        }
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [serverId, getServerStatus, serverStatus]);
  
  return {
    status: serverStatus?.status || "unknown",
    isOnline: serverStatus?.status === "online",
    isOffline: serverStatus?.status === "offline",
    isError: serverStatus?.status === "error",
    isUnknown: serverStatus?.status === "unknown" || !serverStatus,
    lastChecked: serverStatus?.lastChecked || null,
    errorMessage: serverStatus?.errorMessage,
  };
}

/**
 * Hook to monitor all server statuses
 */
export function useAllServerStatuses(): {
  statuses: MCPServerStatus[];
  onlineCount: number;
  offlineCount: number;
  errorCount: number;
  unknownCount: number;
} {
  const { serverStatuses } = useMCP();
  
  const onlineCount = serverStatuses.filter(s => s.status === "online").length;
  const offlineCount = serverStatuses.filter(s => s.status === "offline").length;
  const errorCount = serverStatuses.filter(s => s.status === "error").length;
  const unknownCount = serverStatuses.filter(s => s.status === "unknown").length;
  
  return {
    statuses: serverStatuses,
    onlineCount,
    offlineCount,
    errorCount,
    unknownCount,
  };
}