import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X, LucideIcon } from "lucide-react";
import { AcrInput, AcrInputProps } from "./Input";

export interface AcrSearchInputProps extends Omit<AcrInputProps, "type" | "size"> {
  /**
   * Search icon to display on the left
   * @default Search from lucide-react
   */
  searchIcon?: LucideIcon;

  /**
   * Whether to show a clear button when there's a value
   * @default true
   */
  clearable?: boolean;

  /**
   * Clear icon to display
   * @default X from lucide-react
   */
  clearIcon?: LucideIcon;

  /**
   * Callback when clear button is clicked
   */
  onClear?: () => void;

  /**
   * Position of the search icon
   * @default "left"
   */
  iconPosition?: "left" | "right";

  /**
   * Size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";

  /**
   * Custom className for the container
   */
  containerClassName?: string;

  /**
   * Custom className for the search icon
   */
  iconClassName?: string;

  /**
   * Custom className for the clear button
   */
  clearButtonClassName?: string;
}

const sizeClasses = {
  sm: {
    container: "h-8",
    input: "h-8 text-sm",
    icon: "w-3 h-3",
    padding: (iconPosition: "left" | "right") => iconPosition === "left" ? "pl-8 pr-3" : "pl-3 pr-8",
    iconPosition: (iconPosition: "left" | "right") => iconPosition === "left" ? "left-2.5" : "right-2.5",
    clearPosition: "right-2.5",
  },
  default: {
    container: "h-12",
    input: "h-12",
    icon: "w-4 h-4",
    padding: (iconPosition: "left" | "right") => iconPosition === "left" ? "pl-10 pr-4" : "pl-4 pr-10",
    iconPosition: (iconPosition: "left" | "right") => iconPosition === "left" ? "left-3" : "right-3",
    clearPosition: "right-3",
  },
  lg: {
    container: "h-14",
    input: "h-14 text-lg",
    icon: "w-5 h-5",
    padding: (iconPosition: "left" | "right") => iconPosition === "left" ? "pl-12 pr-5" : "pl-5 pr-12",
    iconPosition: (iconPosition: "left" | "right") => iconPosition === "left" ? "left-3.5" : "right-3.5",
    clearPosition: "right-3.5",
  },
} as const;

/**
 * ACR search input component
 * Input field with search icon and optional clear functionality
 */
export const AcrSearchInput = React.forwardRef<HTMLInputElement, AcrSearchInputProps>(
  (
    {
      searchIcon: SearchIcon = Search,
      clearable = true,
      clearIcon: ClearIcon = X,
      onClear,
      iconPosition = "left",
      size = "default",
      value = "",
      onChange,
      containerClassName,
      iconClassName,
      clearButtonClassName,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeConfig = sizeClasses[size];
    const hasValue = Boolean(value);
    const showClearButton = clearable && hasValue && !disabled;

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        // Create a synthetic event for onChange
        const syntheticEvent = {
          target: { value: "" },
          currentTarget: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className={cn("relative", containerClassName)}>
        {/* Search Icon */}
        <SearchIcon
          className={cn(
            "absolute top-1/2 transform -translate-y-1/2 text-acr-gray-500 pointer-events-none",
            sizeConfig.icon,
            sizeConfig.iconPosition(iconPosition),
            iconClassName
          )}
        />

        {/* Input Field */}
        <AcrInput
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            sizeConfig.input,
            sizeConfig.padding(iconPosition),
            // Adjust padding when clear button is shown
            showClearButton && iconPosition === "left" && "pr-10",
            showClearButton && iconPosition === "right" && "pl-10",
            className
          )}
          {...props}
        />

        {/* Clear Button */}
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2",
              "text-acr-gray-400 hover:text-acr-gray-600 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-1 rounded",
              sizeConfig.clearPosition,
              clearButtonClassName
            )}
            aria-label="Clear search"
          >
            <ClearIcon className={sizeConfig.icon} />
          </button>
        )}
      </div>
    );
  }
);

AcrSearchInput.displayName = "AcrSearchInput";