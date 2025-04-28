"use client";

import { NodeProps } from "reactflow";
import { ArrowDownCircle, ArrowUpCircle, ClipboardCheck } from "lucide-react";
import { BaseNode } from "./base-node";
import { InputNodeData, OutputNodeData } from "@/lib/workflow/types";

export function InputNode({ id, data, selected }: NodeProps<InputNodeData>) {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<ArrowDownCircle className="h-4 w-4" />}
      color="#3b82f6"
      inputs={0}
      outputs={1}
      onConfigure={() => {
        // We'll trigger the configuration dialog in the workflow designer
        const event = new CustomEvent("node:configure", {
          detail: { nodeId: id, nodeType: "input" },
        });
        document.dispatchEvent(event);
      }}
    >
      <div className="space-y-2">
        <div className="rounded-sm bg-muted/50 p-1.5 text-xs">
          <div className="mb-1 font-medium">
            Type: <span className="font-mono">{data.variableType}</span>
          </div>

          {data.defaultValue !== undefined && (
            <div className="grid grid-cols-3 gap-1">
              <span className="col-span-1 font-medium">Default:</span>
              <span className="col-span-2 truncate font-mono">
                {typeof data.defaultValue === "string"
                  ? data.defaultValue
                  : JSON.stringify(data.defaultValue)}
              </span>
            </div>
          )}

          {data.required !== undefined && (
            <div className="grid grid-cols-3 gap-1">
              <span className="col-span-1 font-medium">Required:</span>
              <span className="col-span-2 font-mono">{data.required ? "Yes" : "No"}</span>
            </div>
          )}

          {data.value !== undefined && (
            <div className="mt-2 rounded-sm bg-primary/10 p-1.5">
              <div className="font-medium">Current Value:</div>
              <div className="truncate font-mono">
                {typeof data.value === "string" ? data.value : JSON.stringify(data.value)}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseNode>
  );
}

export function OutputNode({ id, data, selected }: NodeProps<OutputNodeData>) {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<ArrowUpCircle className="h-4 w-4" />}
      color="#10b981"
      inputs={1}
      outputs={0}
      onConfigure={() => {
        // We'll trigger the configuration dialog in the workflow designer
        const event = new CustomEvent("node:configure", {
          detail: { nodeId: id, nodeType: "output" },
        });
        document.dispatchEvent(event);
      }}
    >
      <div className="space-y-2">
        <div className="rounded-sm bg-muted/50 p-1.5 text-xs">
          <div className="mb-1 font-medium">
            Type: <span className="font-mono">{data.outputType}</span>
          </div>

          {data.value !== undefined && (
            <div className="mt-2 rounded-sm bg-primary/10 p-1.5">
              <div className="font-medium">Value:</div>
              <div className="truncate font-mono">
                {typeof data.value === "string" ? data.value : JSON.stringify(data.value)}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseNode>
  );
}

export function NoteNode({ id, data, selected }: NodeProps<any>) {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<ClipboardCheck className="h-4 w-4" />}
      color="#f59e0b"
      inputs={0}
      outputs={0}
      showHandles={false}
      className="bg-yellow-50 dark:bg-yellow-900/20"
      onConfigure={() => {
        // We'll trigger the configuration dialog in the workflow designer
        const event = new CustomEvent("node:configure", {
          detail: { nodeId: id, nodeType: "note" },
        });
        document.dispatchEvent(event);
      }}
    >
      <div className="prose prose-sm dark:prose-invert max-w-none p-2">
        <div className="text-sm">{data.content}</div>
      </div>
    </BaseNode>
  );
}
