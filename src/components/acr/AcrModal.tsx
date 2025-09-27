"use client";

import { X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal
} from "@/components/ui/dialog";
import { AcrButton } from "./Button";
import { cn } from "@/lib/utils";

interface AcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  className?: string;
  "data-testid"?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl"
};

export function AcrModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  className,
  "data-testid": dataTestId
}: AcrModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing via explicit user action (Cancel/X button)
      // Don't close on background click or escape
      if (!open) return;
    }}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-300 data-[state=open]:duration-300" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-6 border border-acr-gray-200 bg-white p-0 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-96 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-top-[20%] data-[state=open]:slide-in-from-top-[20%] data-[state=closed]:duration-300 data-[state=open]:duration-300 data-[state=closed]:ease-in data-[state=open]:ease-out sm:rounded-lg",
            sizeClasses[size],
            className
          )}
          data-testid={dataTestId}
        >
          {/* Header */}
          <DialogHeader className="relative border-b border-acr-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="acr-heading-5 text-acr-gray-900">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="mt-1 acr-body-small text-acr-gray-600">
                    {description}
                  </DialogDescription>
                )}
              </div>
              {showCloseButton && (
                <AcrButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 h-auto text-white hover:text-white hover:bg-acr-gray-600"
                  type="button"
                >
                  <X className="w-4 h-4" />
                  <span className="sr-only">Close</span>
                </AcrButton>
              )}
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="px-6 pb-6">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

// Convenience components for consistent modal layouts
export function AcrModalFooter({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 px-6 py-4 mt-6",
      className
    )}>
      {children}
    </div>
  );
}

export function AcrModalBody({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  );
}