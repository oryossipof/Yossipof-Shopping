import { supabase } from "@/integrations/supabase/client";
import type { GroceryCategory } from "@/lib/grocery-categories";

interface ClassifyResult {
  name: string;
  category: string;
}

// Asks the classify-category edge function for the best category for each
// item name, classifying against the given list's own category set. Never
// throws — returns {} on any failure (offline, function error, etc.) so
// callers can treat it as a best-effort background refinement on top of the
// instant local keyword guess. `categories` is required (not optional) so
// every call site deliberately supplies the current list's categories rather
// than silently classifying against a stale/global default.
export async function classifyItemsWithAI(
  names: string[],
  categories: GroceryCategory[],
): Promise<Record<string, string>> {
  if (names.length === 0) return {};
  try {
    const { data, error } = await supabase.functions.invoke<{ results: ClassifyResult[] }>(
      "classify-category",
      { body: { items: names, categories: categories.map((c) => ({ key: c.key, label: c.label })) } },
    );
    if (error || !data?.results) return {};
    const map: Record<string, string> = {};
    for (const r of data.results) {
      map[r.name] = r.category;
    }
    return map;
  } catch {
    return {};
  }
}
