import { supabase } from "@/integrations/supabase/client";

interface ClassifyResult {
  name: string;
  category: string;
}

// Asks the classify-category edge function for the best category for each
// item name. Never throws — returns {} on any failure (offline, function
// error, etc.) so callers can treat it as a best-effort background refinement
// on top of the instant local keyword guess.
export async function classifyItemsWithAI(
  names: string[],
): Promise<Record<string, string>> {
  if (names.length === 0) return {};
  try {
    const { data, error } = await supabase.functions.invoke<{ results: ClassifyResult[] }>(
      "classify-category",
      { body: { items: names } },
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
