/**
 * Animation utilities for consistent stagger effects
 * Used with ACR entrance animations (fade-up, fade-in, scale-in, slide-up)
 */

/**
 * Predefined stagger classes from globals.css
 * Maps to animation delays: 0.75s, 0.8s, 0.85s, ..., 1.3s
 */
export const STAGGER_CLASSES = [
  "acr-stagger-1",
  "acr-stagger-2",
  "acr-stagger-3",
  "acr-stagger-4",
  "acr-stagger-5",
  "acr-stagger-6",
  "acr-stagger-7",
  "acr-stagger-8",
  "acr-stagger-9",
  "acr-stagger-10",
  "acr-stagger-11",
  "acr-stagger-12",
] as const;

/**
 * Get CSS class name for stagger animation
 * @param index - Item index (0-based)
 * @returns Stagger class name that cycles through 12 delays
 * @example
 * items.map((item, i) => (
 *   <div className={`acr-animate-fade-up ${getStaggerClass(i)}`}>
 * ))
 */
export function getStaggerClass(index: number): string {
  return STAGGER_CLASSES[index % STAGGER_CLASSES.length];
}

/**
 * Get inline animation delay for dynamic stagger effects
 * @param index - Item index (0-based)
 * @param baseDelay - Base delay in seconds (default: 0.7s)
 * @param increment - Delay increment per item (default: 0.05s)
 * @returns CSS delay value as string (e.g., "0.75s")
 * @example
 * <div style={{ animationDelay: getStaggerDelay(index) }}>
 */
export function getStaggerDelay(
  index: number,
  baseDelay = 0.7,
  increment = 0.05
): string {
  return `${baseDelay + (index % 12) * increment}s`;
}
