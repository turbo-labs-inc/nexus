import { InputNodeExecutor } from "./input-node-executor";
import { OutputNodeExecutor } from "./output-node-executor";
import { ConditionNodeExecutor } from "./condition-node-executor";
import { TransformNodeExecutor } from "./transform-node-executor";
import { NodeType } from "@/lib/workflow/types";
import { NodeExecutor } from "../executor";

/**
 * Create and register all node executors
 */
export function createNodeExecutors(): Map<string, NodeExecutor<any>> {
  const executors = new Map<string, NodeExecutor<any>>();
  
  // Register basic executors
  executors.set(NodeType.INPUT, new InputNodeExecutor());
  executors.set(NodeType.OUTPUT, new OutputNodeExecutor());
  executors.set(NodeType.CONDITION, new ConditionNodeExecutor());
  executors.set(NodeType.DATA_TRANSFORM, new TransformNodeExecutor());
  
  return executors;
}

export {
  InputNodeExecutor,
  OutputNodeExecutor,
  ConditionNodeExecutor,
  TransformNodeExecutor
};