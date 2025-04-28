"use client";

import { NodeProps } from "reactflow";
import { Wrench as Tool } from "lucide-react";
import { BaseNode } from "./base-node";
import { MCPToolNodeData } from "@/lib/workflow/types";
import { Badge } from "@/components/ui/badge";

export default function MCPToolNode({ id, data, selected }: NodeProps<MCPToolNodeData>) {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Tool className="h-4 w-4" />}
      color="#6366f1"
      inputs={1}
      outputs={1}
      onConfigure={() => console.log("Configure MCP Tool Node", id)}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {data.serverName || data.serverId}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {data.toolName}
          </Badge>
        </div>

        {Object.keys(data.parameters).length > 0 && (
          <div className="mt-2 space-y-1 rounded-sm bg-muted/50 p-1.5">
            {Object.entries(data.parameters).map(([key, value]) => (
              <div key={key} className="grid grid-cols-5 text-xs">
                <span className="col-span-2 font-medium">{key}:</span>
                <span className="col-span-3 truncate text-muted-foreground">
                  {typeof value === "string"
                    ? value
                    : typeof value === "object"
                      ? JSON.stringify(value).substring(0, 20) + "..."
                      : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {data.result && (
          <div className="mt-2 rounded-sm bg-primary/10 p-1.5 text-xs">
            <div className="font-medium">Result:</div>
            <div className="truncate text-muted-foreground">
              {typeof data.result === "string"
                ? data.result
                : JSON.stringify(data.result).substring(0, 50) + "..."}
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
