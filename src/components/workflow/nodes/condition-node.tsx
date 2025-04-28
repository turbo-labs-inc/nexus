"use client";

import { NodeProps } from "reactflow";
import { GitBranch } from "lucide-react";
import { BaseNode } from "./base-node";
import { ConditionNodeData } from "@/lib/workflow/types";

export default function ConditionNode({ id, data, selected }: NodeProps<ConditionNodeData>) {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<GitBranch className="h-4 w-4" />}
      color="#f59e0b"
      inputs={1}
      outputs={2}
      onConfigure={() => {
        // We'll trigger the configuration dialog in the workflow designer
        const event = new CustomEvent("node:configure", {
          detail: { nodeId: id, nodeType: "condition" },
        });
        document.dispatchEvent(event);
      }}
    >
      <div className="space-y-2">
        <div className="rounded-sm bg-muted/50 p-1.5 text-xs">
          <span className="text-xs font-medium capitalize">{data.conditionType}:</span>

          {data.conditionType === "custom" ? (
            <div className="mt-1 font-mono text-muted-foreground">{data.condition}</div>
          ) : (
            <div className="mt-1 grid grid-cols-3 gap-1">
              <div className="truncate font-mono">{data.leftValue}</div>
              <div className="text-center text-muted-foreground">
                {data.conditionType === "equals" && "=="}
                {data.conditionType === "contains" && "includes"}
                {data.conditionType === "greater" && ">"}
                {data.conditionType === "less" && "<"}
              </div>
              <div className="truncate text-right font-mono">{data.rightValue}</div>
            </div>
          )}
        </div>

        {data.result !== undefined && (
          <div
            className={`mt-2 rounded-sm p-1.5 text-xs ${
              data.result
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
            }`}
          >
            <div className="font-medium">Result: {data.result ? "True" : "False"}</div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
