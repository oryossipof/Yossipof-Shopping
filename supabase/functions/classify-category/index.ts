// Classifies grocery item names into one of the caller's category keys using
// the Gemini API (free tier). Called in the background after an item is
// added/edited so the UI can add items instantly with a local keyword guess,
// then correct the category once a real classification comes back.
//
// Categories are per-list, not fixed: the caller passes the current list's
// { key, label } category set in the request body. If it's missing/empty
// (e.g. an older client, or a request made before the client rollout of
// per-list categories), DEFAULT_CATEGORIES is used as a safe fallback.

const DEFAULT_CATEGORIES: { key: string; label: string }[] = [
  { key: "fruits-vegetables", label: "פירות וירקות" },
  { key: "dairy", label: "מוצרי חלב" },
  { key: "meat-fish", label: "בשר ודגים" },
  { key: "bread-bakery", label: "לחם ומאפים" },
  { key: "drinks", label: "משקאות" },
  { key: "snacks", label: "חטיפים וממתקים" },
  { key: "frozen", label: "קפואים" },
  { key: "cleaning", label: "ניקיון" },
  { key: "hygiene", label: "טיפוח והיגיינה" },
  { key: "spices-canned", label: "תבלינים ושימורים" },
  { key: "grains-pasta", label: "דגנים ופסטה" },
  { key: "baby", label: "תינוקות" },
  { key: "other", label: "אחר" },
];

// Resolves the category set to classify against for this request: the
// caller-supplied list categories when valid, guaranteeing "other" is always
// present as a fallback key; otherwise DEFAULT_CATEGORIES.
function resolveCategories(reqCategories: unknown): { key: string; label: string }[] {
  if (Array.isArray(reqCategories) && reqCategories.length > 0) {
    const cleaned = reqCategories
      .filter(
        (c): c is { key: string; label: string } =>
          !!c &&
          typeof c.key === "string" &&
          c.key.trim().length > 0 &&
          typeof c.label === "string" &&
          c.label.trim().length > 0,
      )
      .map((c) => ({ key: c.key.trim(), label: c.label.trim() }));
    if (cleaned.length > 0) {
      return cleaned.some((c) => c.key === "other")
        ? cleaned
        : [...cleaned, { key: "other", label: "אחר" }];
    }
  }
  return DEFAULT_CATEGORIES;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-3.5-flash-lite";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, categories: reqCategories } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const names: string[] = items
      .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
      .slice(0, 50)
      .map((n) => n.trim());

    if (names.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const categories = resolveCategories(reqCategories);
    const categoryKeys = categories.map((c) => c.key);
    const categoryList = categories.map((c) => `- ${c.key}: ${c.label}`).join("\n");
    const itemList = names.map((n, i) => `${i + 1}. ${n}`).join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are a Hebrew grocery-list classifier. You assign each grocery item name to " +
                  "exactly one category from a fixed list, based on what the product actually is " +
                  "(not just words it contains). For example, a soup powder or stock cube flavored " +
                  '"chicken" (e.g. "אבקת מרק עוף") is a dry seasoning/soup product, not meat.',
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    `Categories:\n${categoryList}\n\n` +
                    `Classify each of these grocery item names into exactly one category key:\n${itemList}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                results: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      category: { type: "STRING", enum: categoryKeys },
                    },
                    required: ["name", "category"],
                  },
                },
              },
              required: ["results"],
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const rawResults: { name: string; category: string }[] = text
      ? (JSON.parse(text).results ?? [])
      : [];

    const results = names.map((name, i) => {
      const match = rawResults.find((r) => r.name === name) ?? rawResults[i];
      const category =
        match && categoryKeys.includes(match.category) ? match.category : "other";
      return { name, category };
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("classify-category error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
