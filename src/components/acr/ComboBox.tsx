import React, { useState, useMemo, useId } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "../ui/skeleton";

export interface AcrComboBoxOption {
  value: string;
  label: string;
}

export interface AcrComboBoxProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: AcrComboBoxOption[] | undefined;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustomValue?: boolean;
  onCreateValue?: (value: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
}

export const AcrComboBox = React.forwardRef<
  HTMLButtonElement,
  AcrComboBoxProps
>(
  (
    {
      value,
      onValueChange,
      options = [],
      placeholder = "Select option...",
      searchPlaceholder,
      allowCustomValue = false,
      onCreateValue,
      disabled = false,
      className,
      isLoading,
    },
    ref
  ) => {
    const { t } = useLocale();
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const listboxId = useId();

    // Handle display label - show custom values that aren't in options yet
    const displayLabel =
      options?.find((option) => option.value === value)?.label || value; // Fallback to raw value for custom entries

    // Implement filtering logic based on searchValue
    const filteredOptions = useMemo(() => {
      if (!options || searchValue.length === 0) {
        return options || [];
      }

      return options.filter((option) => {
        return option.value
          .toLowerCase()
          .trim()
          .includes(searchValue.toLowerCase().trim());
      });
    }, [options, searchValue]);

    // Implement custom value creation logic
    const handleCustomValueCreation = async (value: string) => {
      if (onCreateValue) {
        await onCreateValue(value);
        onValueChange(value); // Select the newly created value
        setOpen(false);
      }
    };

    // Handle selection logic
    const handleOptionSelection = (value: string) => {
      if (value) {
        onValueChange(value);
      }
      setOpen(false);
    };

    // Handle keyboard interactions for opening the dropdown
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      // Open dropdown on Space, Enter, or Arrow keys
      if (
        e.key === " " ||
        e.key === "Enter" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };

    if (isLoading) {
      return <Skeleton className={cn("w-full h-12 rounded-lg", className)} />;
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-label={placeholder}
            aria-expanded={open}
            aria-controls={listboxId}
            onKeyDown={handleKeyDown}
            className={cn(
              // Base layout
              "flex items-center justify-between w-full",
              "h-12 px-4 py-3",

              // Typography
              "text-sm font-medium text-left",

              // Crisp borders & background
              "bg-white rounded-lg",
              "border-2 border-acr-gray-900",

              // Smooth transitions
              "transition-all duration-150 ease-out",

              // Hover state
              "hover:border-acr-gray-700",

              // Focus state - subtle black ring
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black",

              // Open state
              open && "ring-1 ring-black border-acr-gray-900",

              // Text colors - placeholder matches border color
              "text-acr-gray-900",

              // Disabled state
              disabled && [
                "bg-acr-gray-100 text-acr-gray-400",
                "border-acr-gray-300 cursor-not-allowed",
              ],

              className
            )}
            disabled={disabled}
          >
            <span className="flex-1 truncate">
              {displayLabel || placeholder}
            </span>
            <ChevronDown
              className={cn(
                "ml-2 h-4 w-4 shrink-0 text-acr-gray-600",
                "transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className={cn(
            "p-0 overflow-hidden",
            "bg-white rounded-lg",
            "border border-acr-gray-200",
            "shadow-lg shadow-acr-gray-900/10"
          )}
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder={searchPlaceholder || t("common.search")}
              value={searchValue}
              onValueChange={setSearchValue}
              className="border-b border-acr-gray-200"
            />
            <CommandList id={listboxId} className="max-h-[280px]">
              <CommandEmpty className="py-4 text-center text-sm text-acr-gray-500">
                {allowCustomValue && searchValue.trim()
                  ? t("comboBox.noMatchesAddNew").replace(
                      "{{value}}",
                      searchValue
                    )
                  : t("comboBox.noResults")}
              </CommandEmpty>
              <CommandGroup className="p-1.5">
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleOptionSelection}
                    className={cn(
                      "relative flex items-center",
                      "px-3 py-2.5 rounded-md",
                      "text-sm text-acr-gray-900",
                      "cursor-pointer select-none",
                      "transition-colors duration-100",
                      "data-[selected=true]:bg-acr-gray-100",
                      "hover:bg-acr-gray-50",
                      // Selected item styling
                      value === option.value &&
                        "bg-acr-red-50 text-acr-red-900 font-medium"
                    )}
                  >
                    <span className="flex-1">{option.label}</span>
                    {value === option.value && (
                      <Check className="h-4 w-4 text-acr-red-600 ml-2" />
                    )}
                  </CommandItem>
                ))}
                {allowCustomValue &&
                  searchValue.trim() &&
                  filteredOptions.length === 0 &&
                  onCreateValue && (
                    <CommandItem
                      value={searchValue}
                      onSelect={handleCustomValueCreation}
                      className={cn(
                        "px-3 py-2.5 rounded-md",
                        "text-sm text-acr-gray-900",
                        "cursor-pointer select-none",
                        "transition-colors duration-100",
                        "data-[selected=true]:bg-acr-gray-100",
                        "hover:bg-acr-gray-50"
                      )}
                    >
                      {t("comboBox.addValue").replace("{{value}}", searchValue)}
                    </CommandItem>
                  )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

AcrComboBox.displayName = "AcrComboBox";
