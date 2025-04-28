"use client";

import * as React from "react";
import { ToastVariant, useToast } from "./use-toast";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  onDismiss: (id: string) => void;
}

export function Toast({ id, title, description, variant = "default", onDismiss }: ToastProps) {
  const icon = React.useMemo(() => {
    switch (variant) {
      case "destructive":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  }, [variant]);

  const bgColor = React.useMemo(() => {
    switch (variant) {
      case "destructive":
        return "bg-red-50";
      case "success":
        return "bg-green-50";
      default:
        return "bg-white";
    }
  }, [variant]);

  const borderColor = React.useMemo(() => {
    switch (variant) {
      case "destructive":
        return "border-red-300";
      case "success":
        return "border-green-300";
      default:
        return "border-gray-200";
    }
  }, [variant]);

  return (
    <div
      className={`flex w-full max-w-sm overflow-hidden rounded-lg border shadow-md ${bgColor} ${borderColor}`}
      role="alert"
    >
      <div className="flex items-center gap-2 p-4">
        {icon}
        <div className="flex-1">
          {title && <p className="text-sm font-medium">{title}</p>}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <button
          className="h-5 w-5 rounded-md p-0.5 hover:bg-gray-200"
          onClick={() => onDismiss(id)}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col-reverse md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}