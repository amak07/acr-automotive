"use client";

import React from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportStepIndicatorProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
}

export function ImportStepIndicator({ currentStep, onStepClick }: ImportStepIndicatorProps) {
  const { t } = useLocale();

  const steps = [
    { number: 1, label: t("admin.import.steps.upload") },
    { number: 2, label: "Review Changes" }, // Combined validate + preview
    { number: 3, label: t("admin.import.steps.confirm") },
  ] as const;

  const getStepStatus = (stepNumber: number): "complete" | "current" | "pending" => {
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

      {/* Mobile: Compact stepper */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-acr-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {steps.map((step) => {
              const status = getStepStatus(step.number);
              return (
                <button
                  key={step.number}
                  onClick={() => canNavigateToStep(step.number) && onStepClick?.(step.number)}
                  disabled={!canNavigateToStep(step.number)}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all",
                    status === "complete" && "bg-green-600 text-white",
                    status === "current" && "bg-acr-red-600 text-white ring-2 ring-acr-red-300",
                    status === "pending" && "bg-acr-gray-300 text-acr-gray-600"
                  )}
                  aria-current={status === "current" ? "step" : undefined}
                  aria-label={step.label}
                >
                  {status === "complete" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-sm font-medium text-acr-gray-700">
            {steps.find((s) => s.number === currentStep)?.label}
          </div>
        </div>
      </div>

      {/* Progress bar for screen readers */}
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-label={`Step ${currentStep} of 3: ${steps.find((s) => s.number === currentStep)?.label}`}
        className="sr-only"
      />
    </div>
  );
}
