"use client";

import { useState } from "react";
import { BaseConfigDialog, BaseConfigDialogProps } from "./base-config-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { NoteNodeData } from "@/lib/workflow/types";

type NoteNodeConfigProps = Omit<
  BaseConfigDialogProps,
  "nodeData" | "children" | "title" | "description" | "onSave"
> & {
  nodeData: NoteNodeData;
  onSave: (data: NoteNodeData) => void;
};

export function NoteNodeConfig({ isOpen, onClose, onSave, nodeData, nodeId }: NoteNodeConfigProps) {
  const [formData, setFormData] = useState<NoteNodeData>({ ...nodeData });

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

  const handleSaveChanges = (baseData: NoteNodeData) => {
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
      title="Configure Note"
      description="Add documentation or notes to your workflow."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="content" className="pt-2 text-right">
            Note Content
          </Label>
          <Textarea
            id="content"
            name="content"
            value={formData.content || ""}
            onChange={handleInputChange}
            className="col-span-3"
            rows={8}
            placeholder="Enter your note content here..."
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="fontSize" className="text-right">
            Font Size
          </Label>
          <Input
            id="fontSize"
            name="fontSize"
            type="number"
            value={formData.fontSize || 14}
            onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
            className="col-span-3"
            min={8}
            max={24}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="width" className="text-right">
            Width (px)
          </Label>
          <Input
            id="width"
            name="width"
            type="number"
            value={formData.width || 250}
            onChange={(e) => handleChange("width", parseInt(e.target.value))}
            className="col-span-3"
            min={100}
            max={500}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="height" className="text-right">
            Height (px)
          </Label>
          <Input
            id="height"
            name="height"
            type="number"
            value={formData.height || 150}
            onChange={(e) => handleChange("height", parseInt(e.target.value))}
            className="col-span-3"
            min={50}
            max={500}
          />
        </div>
      </div>
    </BaseConfigDialog>
  );
}
