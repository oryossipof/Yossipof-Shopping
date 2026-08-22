// The message shown whenever a product name is already taken in the list.
export const DUPLICATE_MESSAGE = "המוצר כבר קיים ברשימה";

/**
 * Canonical form of a product name, used only for duplicate detection —
 * never for display or storage.
 *
 * Two names are "the same product" when they differ only by case, by spacing,
 * or by the assorted apostrophe-like characters Hebrew typing produces:
 * קוטג׳ (geresh) == קוטג' (ASCII) == קוטג, and חלב 3% == "  חלב 3%  ".
 */
export function normalizeProductName(name: string): string {
  return name
    .replace(/[׳״'"`‘’“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
