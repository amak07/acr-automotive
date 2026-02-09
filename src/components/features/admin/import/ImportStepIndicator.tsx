"use client";

import React from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportStepIndicatorProps {
  currentStep: 1 | 2;
  onStepClick?: (step: 1 | 2) => void;
  isImportComplete?: boolean;
}

export function ImportStepIndicator({ currentStep, onStepClick, isImportComplete }: ImportStepIndicatorProps) {
  const { t } = useLocale();

  const steps = [
    { number: 1, label: t("admin.import.steps.upload") },
    { number: 2, label: t("admin.import.steps.reviewChanges") },
  ] as const;

  const getStepStatus = (stepNumber: number): "complete" | "current" | "pending" => {
    if (isImportComplete) return "complete";
    if (stepNumber < currentStep) return "complete";
    if (stepNumber === currentStep) return "current";
    return "pending";
  };

  const canNavigateToStep = (stepNumber: number): boolean => {
    return stepNumber < currentStep;
  };

  return (
    <div className="w-full">
      {/* Desktop/Tablet: Horizontal stepper */}
      <div className="hidden sm:flex items-center w-full">
        {steps.map((step, index) => {
          const status = getStepStatus(step.number);
          const canNavigate = canNavigateToStep(step.number);

          return (
            <React.Fragment key={step.number}>
              {/* Step Badge + Label */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => canNavigate && onStepClick?.(step.number)}
                  disabled={!canNavigate}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-all bg-white border-2",
                    "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-2",
                    status === "complete" && "border-green-600 text-green-600 hover:bg-green-50 cursor-pointer",
                    status === "current" && "border-acr-red-600 text-acr-red-600",
                    status === "pending" && "border-acr-gray-300 text-acr-gray-400 cursor-not-allowed"
                  )}
                  aria-current={status === "current" ? "step" : undefined}
                  aria-label={`${step.label} - ${status}`}
                >
                  {status === "complete" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </button>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors whitespace-nowrap",
                    status === "complete" && "text-green-700",
                    status === "current" && "text-acr-red-600",
                    status === "pending" && "text-acr-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Separator (except after last step) */}
              {index < steps.length - 1 && (
                <Separator
                  className={cn(
                    "flex-1 mx-4 h-0.5 transition-colors",
                    status === "complete" && "bg-green-600",
                    status !== "complete" && "bg-acr-gray-300"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: Enhanced vertical stepper */}
      <div className="sm:hidden space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(step.number);
          const canNavigate = canNavigateToStep(step.number);
          const isActive = status === "current";
          const isComplete = status === "complete";
          const isPending = status === "pending";

          return (
            <div key={step.number} className="relative">
              <button
                onClick={() => canNavigate && onStepClick?.(step.number)}
                disabled={!canNavigate}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-2",
                  isActive && "bg-gradient-to-r from-acr-red-50 to-acr-red-100/50 border-2 border-acr-red-500 shadow-md",
                  isComplete && "bg-gradient-to-r from-green-50 to-green-100/50 border-2 border-green-500 hover:shadow-md cursor-pointer",
                  isPending && "bg-acr-gray-50 border-2 border-acr-gray-200 cursor-not-allowed opacity-60"
                )}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${step.label} - ${status}`}
              >
                {/* Step number/icon */}
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg flex-shrink-0 transition-all",
                    isActive && "bg-acr-red-600 text-white shadow-lg",
                    isComplete && "bg-green-600 text-white",
                    isPending && "bg-acr-gray-300 text-acr-gray-600"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle className="w-6 h-6" strokeWidth={2.5} />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step label and description */}
                <div className="flex-1 text-left">
                  <div
                    className={cn(
                      "font-semibold text-base transition-colors",
                      isActive && "text-acr-red-900",
                      isComplete && "text-green-900",
                      isPending && "text-acr-gray-600"
                    )}
                  >
                    {step.label}
                  </div>
                  <div
                    className={cn(
                      "text-xs mt-0.5 transition-colors",
                      isActive && "text-acr-red-700",
                      isComplete && "text-green-700",
                      isPending && "text-acr-gray-500"
                    )}
                  >
                    {isComplete && t("admin.import.steps.completed")}
                    {isActive && t("admin.import.steps.inProgress")}
                    {isPending && t("admin.import.steps.pending")}
                  </div>
                </div>

                {/* Progress indicator badge */}
                <div className="flex-shrink-0">
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-acr-red-600 animate-pulse" />
                  )}
                  {isComplete && (
                    <div className="text-green-600 text-xs font-semibold">✓</div>
                  )}
                </div>
              </button>

              {/* Connecting line to next step */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-10 top-16 w-0.5 h-3 transition-colors",
                    isComplete && "bg-green-500",
                    !isComplete && "bg-acr-gray-300"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar for screen readers */}
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={2}
        aria-label={`Step ${currentStep} of 2: ${steps.find((s) => s.number === currentStep)?.label}`}
        className="sr-only"
      />
    </div>
  );
}
