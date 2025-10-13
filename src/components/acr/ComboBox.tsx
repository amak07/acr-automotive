import React, { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
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
import { useMemo } from "react";
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

    // Handle display label - show custom values that aren't in options yet
    const displayLabel = options?.find(
      (option) => option.value === value
    )?.label || value; // Fallback to raw value for custom entries

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
      return <Skeleton className={cn("w-full", "h-12")} />;
    } else {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              onKeyDown={handleKeyDown}
              className={cn(
                // ACR-specific styling overrides
                "pl-4 pr-3 py-3 h-auto w-full", // ACR spacing standards

                // Base styles
                "transition-colors duration-200",

                // Coca-Cola chunky style - matches inputs
                "!border-black !border !bg-white !text-black",
                "hover:!border-gray-600 hover:!shadow-[0_0_0_2px_rgba(0,0,0,0.24)]", // Coca-Cola hover
                "!px-6 !py-4", // Extra padding but keep normal radius
                "!font-medium", // Slightly bolder text

                // Focus state - matches Coca-Cola (force override all focus styles)
                "!focus:outline-2 !focus:outline-black !focus:outline-offset-2 !focus:border-black !focus:ring-0",
                "!focus-visible:outline-2 !focus-visible:outline-black !focus-visible:outline-offset-2 !focus-visible:border-black !focus-visible:ring-0",
                "focus:!outline focus-visible:!outline", // Force outline to be visible
                // Override any red focus styles
                "focus:!border-black focus-visible:!border-black focus:!ring-black focus-visible:!ring-black",
                "focus:!ring-offset-0 focus-visible:!ring-offset-0",

                // Open state - show dark border when dropdown is open (like Select component)
                // Need to override button's focus-visible behavior
                open && [
                  "!border-black !outline-2 !outline-black !outline-offset-2",
                  "focus-visible:!outline-2 focus-visible:!outline-black focus-visible:!outline-offset-2",
                  "focus:!outline-2 focus:!outline-black focus:!outline-offset-2"
                ],

                // Custom dropdown arrow styling - black to match Coca-Cola style
                "[&>*[data-radix-select-icon]]:!text-black [&>*[data-radix-select-icon]]:!opacity-100",
                "[&_svg]:!text-black [&_svg]:!opacity-100",

                // disabled styles
                disabled &&
                  "!bg-acr-gray-50 !text-acr-gray-500 !cursor-not-allowed !opacity-50",

                className
              )}
              disabled={disabled}
            >
              <span className="flex-1 text-left truncate">
                {displayLabel ? displayLabel : placeholder}
              </span>
              <ChevronsUpDown className="ml-1 mr-1 h-4 w-4 shrink-0 !text-black !opacity-100" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={4}
            className={cn(
              "p-0",
              "border-acr-gray-200 bg-white",
              "shadow-lg"
            )}
            style={{ width: "var(--radix-popover-trigger-width)" }}
          >
            <Command>
              <CommandInput
                placeholder={searchPlaceholder || t("common.search")}
                value={searchValue}
                className="[&>svg]:!ml-4 [&_input]:!pl-4" // Fix search icon padding - more space
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>
                  {allowCustomValue && searchValue.trim()
                    ? t("comboBox.noMatchesAddNew").replace("{{value}}", searchValue)
                    : t("comboBox.noResults")}
                </CommandEmpty>
                <CommandGroup>
                  {/* Map through filtered options */}
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={handleOptionSelection}
                      className={cn(
                        "text-acr-gray-900 focus:bg-acr-red-50 focus:text-acr-red-900",
                        "cursor-pointer"
                      )}
                    >
                      {option.label}
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
                          "text-acr-gray-900 focus:bg-acr-red-50 focus:text-acr-red-900",
                          "cursor-pointer"
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
  }
);

AcrComboBox.displayName = "AcrComboBox";
