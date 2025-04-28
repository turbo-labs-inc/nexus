"use client";

import { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ExecutionStatus, NodeData } from "@/lib/workflow/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings2, XCircle, Clock, CheckCircle, AlertCircle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BaseNodeProps {
  id: string;
  data: NodeData;
  selected: boolean;
  icon?: React.ReactNode;
  color?: string;
  inputs?: number;
  outputs?: number;
  showHandles?: boolean;
  className?: string;
  children?: React.ReactNode;
  onConfigure?: () => void;
  // Required by NodeProps but not used in our implementation
  type?: string;
  zIndex?: number;
  isConnectable?: boolean;
  xPos?: number;
  yPos?: number;
  dragHandle?: string;
}

export function BaseNode({
  data,
  selected,
  icon,
  color = "#6366f1",
  inputs = 1,
  outputs = 1,
  showHandles = true,
  className,
  children,
  onConfigure,
}: BaseNodeProps) {
  const [hovered, setHovered] = useState(false);

  // Apply status colors
  const getStatusColor = () => {
    switch (data.status) {
      case ExecutionStatus.RUNNING:
        return "bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700";
      case ExecutionStatus.SUCCEEDED:
        return "bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700";
      case ExecutionStatus.FAILED:
        return "bg-red-50 border-red-300 dark:bg-red-900/30 dark:border-red-700";
      default:
        return "bg-background border-border";
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (data.status) {
      case ExecutionStatus.RUNNING:
        return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case ExecutionStatus.SUCCEEDED:
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case ExecutionStatus.FAILED:
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case ExecutionStatus.QUEUED:
        return <PlayCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return null;
    }
  };

  // Generate input handles
  const inputHandles = () => {
    return Array.from({ length: inputs }).map((_, i) => (
      <Handle
        key={`input-${i}`}
        type="target"
        position={Position.Left}
        id={`input-${i}`}
        className={cn(
          "h-3 w-3 rounded-full border-2 border-background bg-primary",
          { "!bg-green-500": data.status === ExecutionStatus.SUCCEEDED },
          { "!bg-red-500": data.status === ExecutionStatus.FAILED }
        )}
        style={{ left: -5, top: `${((i + 1) / (inputs + 1)) * 100}%` }}
      />
    ));
  };

  // Generate output handles
  const outputHandles = () => {
    return Array.from({ length: outputs }).map((_, i) => (
      <Handle
        key={`output-${i}`}
        type="source"
        position={Position.Right}
        id={`output-${i}`}
        className={cn(
          "h-3 w-3 rounded-full border-2 border-background bg-primary",
          { "!bg-green-500": data.status === ExecutionStatus.SUCCEEDED },
          { "!bg-red-500": data.status === ExecutionStatus.FAILED }
        )}
        style={{ right: -5, top: `${((i + 1) / (outputs + 1)) * 100}%` }}
      />
    ));
  };

  return (
    <div
      className={cn(
        "relative min-h-[80px] min-w-[180px] max-w-[280px] rounded-lg border-2 p-3 shadow-sm transition-all",
        getStatusColor(),
        selected ? "!border-primary ring-2 ring-primary ring-opacity-20" : "border-border",
        className
      )}
      style={{
        borderLeftColor: color,
        borderLeftWidth: "4px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Node header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="font-medium leading-none">{data.label}</div>
        </div>

        {data.status && (
          <Badge
            variant={
              data.status === ExecutionStatus.SUCCEEDED
                ? "default"
                : data.status === ExecutionStatus.FAILED
                  ? "destructive"
                  : data.status === ExecutionStatus.RUNNING
                    ? "secondary"
                    : "outline"
            }
            className={cn(
              "flex gap-1 px-1.5 py-0.5 text-xs font-normal",
              data.status === ExecutionStatus.SUCCEEDED &&
                "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/40",
              data.status === ExecutionStatus.RUNNING &&
                "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
            )}
          >
            {getStatusIcon()}
            <span className="capitalize">{data.status}</span>
          </Badge>
        )}

        {/* Configuration button */}
        {hovered && onConfigure && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute -right-2 -top-2 h-6 w-6 opacity-80 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure();
            }}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Description */}
      {data.description && <p className="mb-2 text-xs text-muted-foreground">{data.description}</p>}

      {/* Node content */}
      <div className="min-h-[20px]">{children}</div>

      {/* Error message */}
      {data.error && (
        <div className="mt-2 flex items-start gap-1 rounded-sm bg-red-100 p-1.5 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300">
          <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{data.error}</span>
        </div>
      )}

      {/* Execution time */}
      {data.executionTime && (
        <div className="mt-2 text-right text-xs text-muted-foreground">
          {data.executionTime.toFixed(2)}ms
        </div>
      )}

      {/* Input/Output handles */}
      {showHandles && inputHandles()}
      {showHandles && outputHandles()}
    </div>
  );
}
