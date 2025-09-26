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
              className={cn(
                // ACR-specific styling overrides
                "pl-4 pr-3 py-3 h-auto w-full", // ACR spacing standards
                "border-acr-gray-400 bg-white hover:border-acr-red-300 hover:bg-transparent", // ACR colors with hover
                "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent", // ACR focus states
                "transition-colors duration-200", // Smooth transitions
                "data-[placeholder]:text-acr-gray-500", // ACR placeholder color - darker

                // Custom dropdown arrow styling - force darker color with higher specificity
                "[&>*[data-radix-select-icon]]:!text-acr-gray-500 [&>*[data-radix-select-icon]]:!opacity-100",
                "[&_svg]:!text-acr-gray-500 [&_svg]:!opacity-100",

                // disabled styles
                disabled &&
                  "bg-acr-gray-50 text-acr-gray-500 cursor-not-allowed opacity-50",

                className
              )}
              disabled={disabled}
            >
              <span className="flex-1 text-left truncate">
                {displayLabel ? displayLabel : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
