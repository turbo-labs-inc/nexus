"use client";

import { NodeProps } from "reactflow";
import { Bot } from "lucide-react";
import { BaseNode } from "./base-node";
import { FastAgentNodeData } from "@/lib/workflow/types";
import { Badge } from "@/components/ui/badge";

export default function FastAgentNode({ id, data, selected }: NodeProps<FastAgentNodeData>) {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Bot className="h-4 w-4" />}
      color="#ec4899"
      inputs={1}
      outputs={1}
      onConfigure={() => console.log("Configure Fast-Agent Node", id)}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {data.agentName}
          </Badge>
        </div>

        {data.instruction && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Instruction:</span>
            <p className="mt-0.5 line-clamp-2">{data.instruction}</p>
          </div>
        )}

        {data.tools && data.tools.length > 0 && (
          <div className="mt-2">
            <span className="text-xs font-medium">Tools:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {data.tools.map((tool) => (
                <Badge key={tool} variant="secondary" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.message && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Input:</span>
            <p className="mt-0.5 line-clamp-2">{data.message}</p>
          </div>
        )}

        {data.result && (
          <div className="mt-2 rounded-sm bg-primary/10 p-1.5 text-xs">
            <div className="font-medium">Result:</div>
            <div className="line-clamp-3 text-muted-foreground">{data.result}</div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
