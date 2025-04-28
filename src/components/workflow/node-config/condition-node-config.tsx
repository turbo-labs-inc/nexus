"use client";

import { useState } from "react";
import { BaseConfigDialog, BaseConfigDialogProps } from "./base-config-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConditionNodeData } from "@/lib/workflow/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type ConditionNodeConfigProps = Omit<
  BaseConfigDialogProps,
  "nodeData" | "children" | "title" | "description" | "onSave"
> & {
  nodeData: ConditionNodeData;
  onSave: (data: ConditionNodeData) => void;
};

export function ConditionNodeConfig({
  isOpen,
  onClose,
  onSave,
  nodeData,
  nodeId,
}: ConditionNodeConfigProps) {
  const [formData, setFormData] = useState<ConditionNodeData>({ ...nodeData });

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  const handleSaveChanges = (baseData: ConditionNodeData) => {
    onSave({
      ...baseData,
      ...formData,
    });
  };

  return (
    <BaseConfigDialog
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSaveChanges}
      nodeData={nodeData}
      nodeId={nodeId}
      title="Configure Condition Node"
      description="Set up the condition that determines the flow path."
    >
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="conditionType" className="text-right">
              Condition Type
            </Label>
            <Select
              value={formData.conditionType}
              onValueChange={(value: "equals" | "contains" | "greater" | "less" | "custom") =>
                handleChange("conditionType", value)
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select condition type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals (==)</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="greater">Greater Than (&gt;)</SelectItem>
                <SelectItem value="less">Less Than (&lt;)</SelectItem>
                <SelectItem value="custom">Custom Expression</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.conditionType === "custom" ? (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="condition" className="pt-2 text-right">
                Expression
              </Label>
              <Textarea
                id="condition"
                name="condition"
                value={formData.condition || ""}
                onChange={handleInputChange}
                className="col-span-3 font-mono"
                rows={3}
                placeholder="Enter a custom condition expression (e.g., data.value > 10 && data.status === 'active')"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="leftValue" className="text-right">
                  Left Value
                </Label>
                <Input
                  id="leftValue"
                  name="leftValue"
                  value={formData.leftValue || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Variable or value on the left side"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rightValue" className="text-right">
                  Right Value
                </Label>
                <Input
                  id="rightValue"
                  name="rightValue"
                  value={formData.rightValue || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Variable or value on the right side"
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 pt-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="fullCondition" className="pt-2 text-right">
              Full Condition
            </Label>
            <Textarea
              id="fullCondition"
              name="condition"
              value={formData.condition || ""}
              onChange={handleInputChange}
              className="col-span-3 font-mono"
              rows={5}
              placeholder="The full condition logic that will be executed"
              readOnly={formData.conditionType !== "custom"}
            />
          </div>
          <div className="col-span-3 pl-32 text-xs text-muted-foreground">
            <p className="mb-2">You can use the following in your conditions:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <code>input</code> - The input data from the previous node
              </li>
              <li>
                <code>context</code> - The global workflow context
              </li>
              <li>
                <code>payload</code> - The original input payload
              </li>
              <li>
                Simple expressions like <code>input.value &gt; 10</code>
              </li>
              <li>
                Complex conditions with <code>&amp;&amp;</code> and <code>||</code> operators
              </li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </BaseConfigDialog>
  );
}
