"use client";

import { useState } from "react";
import { BaseConfigDialog, BaseConfigDialogProps } from "./base-config-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OutputNodeData } from "@/lib/workflow/types";

type OutputNodeConfigProps = Omit<
  BaseConfigDialogProps,
  "nodeData" | "children" | "title" | "description" | "onSave"
> & {
  nodeData: OutputNodeData;
  onSave: (data: OutputNodeData) => void;
};

export function OutputNodeConfig({
  isOpen,
  onClose,
  onSave,
  nodeData,
  nodeId,
}: OutputNodeConfigProps) {
  const [formData, setFormData] = useState<OutputNodeData>({ ...nodeData });

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveChanges = (baseData: OutputNodeData) => {
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
      title="Configure Output Node"
      description="Define how data should be output from this workflow."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="outputType" className="text-right">
            Output Type
          </Label>
          <Select
            value={formData.outputType}
            onValueChange={(value: "result" | "log" | "error" | "data") =>
              handleChange("outputType", value)
            }
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select output type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="result">Result (Main Output)</SelectItem>
              <SelectItem value="log">Log (For Debugging)</SelectItem>
              <SelectItem value="error">Error (Handle Failures)</SelectItem>
              <SelectItem value="data">Data (For Further Processing)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </BaseConfigDialog>
  );
}
