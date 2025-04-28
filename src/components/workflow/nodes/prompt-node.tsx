"use client";

import { NodeProps } from "reactflow";
import { MessageSquare } from "lucide-react";
import { BaseNode } from "./base-node";
import { PromptNodeData } from "@/lib/workflow/types";

export default function PromptNode({ id, data, selected }: NodeProps<PromptNodeData>) {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<MessageSquare className="h-4 w-4" />}
      color="#0ea5e9"
      inputs={1}
      outputs={1}
      onConfigure={() => console.log("Configure Prompt Node", id)}
    >
      <div className="space-y-2">
        <div className="text-xs">
          <span className="font-medium">Template:</span>
          <div className="mt-1 rounded-sm bg-muted/50 p-1.5 font-mono">
            <p className="line-clamp-3">{data.promptTemplate}</p>
          </div>
        </div>

        {Object.keys(data.variables).length > 0 && (
          <div className="mt-2 space-y-1 rounded-sm bg-muted/50 p-1.5">
            <span className="text-xs font-medium">Variables:</span>
            {Object.entries(data.variables).map(([key, value]) => (
              <div key={key} className="grid grid-cols-5 text-xs">
                <span className="col-span-2 font-mono">{key}:</span>
                <span className="col-span-3 truncate text-muted-foreground">{value}</span>
              </div>
            ))}
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
