"use client";

import { NodeProps } from "reactflow";
import { ArrowLeftRight } from "lucide-react";
import { BaseNode } from "./base-node";
import { DataTransformNodeData } from "@/lib/workflow/types";
import { Badge } from "@/components/ui/badge";

export default function TransformNode({ id, data, selected }: NodeProps<DataTransformNodeData>) {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<ArrowLeftRight className="h-4 w-4" />}
      color="#ec4899"
      inputs={1}
      outputs={1}
      onConfigure={() => {
        // We'll trigger the configuration dialog in the workflow designer
        const event = new CustomEvent("node:configure", {
          detail: { nodeId: id, nodeType: "transform" },
        });
        document.dispatchEvent(event);
      }}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs capitalize">
            {data.transformType}
          </Badge>
        </div>

        <div className="mt-2 rounded-sm bg-muted/50 p-1.5 text-xs">
          <span className="font-medium">Transform:</span>
          <div className="mt-1 max-h-20 overflow-y-auto rounded-sm bg-muted p-1 font-mono text-xs text-muted-foreground">
            {data.transformFunction}
          </div>
        </div>

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
