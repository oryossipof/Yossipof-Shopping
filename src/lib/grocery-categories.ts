export interface GroceryCategory {
  key: string;
  label: string;
  emoji: string;
}

const CATEGORIES: GroceryCategory[] = [
  { key: "fruits-vegetables", label: "פירות וירקות", emoji: "🥬" },
  { key: "dairy", label: "מוצרי חלב", emoji: "🧀" },
  { key: "meat-fish", label: "בשר ודגים", emoji: "🥩" },
  { key: "bread-bakery", label: "לחם ומאפים", emoji: "🍞" },
  { key: "drinks", label: "משקאות", emoji: "🥤" },
  { key: "snacks", label: "חטיפים וממתקים", emoji: "🍫" },
  { key: "frozen", label: "קפואים", emoji: "🧊" },
  { key: "cleaning", label: "ניקיון", emoji: "🧹" },
  { key: "hygiene", label: "טיפוח והיגיינה", emoji: "🧴" },
  { key: "spices-canned", label: "תבלינים ושימורים", emoji: "🫙" },
  { key: "grains-pasta", label: "דגנים ופסטה", emoji: "🍝" },
  { key: "baby", label: "תינוקות", emoji: "🍼" },
  { key: "other", label: "אחר", emoji: "📦" },
];

const KEYWORD_MAP: Record<string, string> = {
  // Fruits & vegetables
  "תפוח": "fruits-vegetables", "בננה": "fruits-vegetables", "תפוז": "fruits-vegetables",
  "עגבניה": "fruits-vegetables", "עגבניות": "fruits-vegetables", "מלפפון": "fruits-vegetables",
  "מלפפונים": "fruits-vegetables", "חסה": "fruits-vegetables", "גזר": "fruits-vegetables",
  "בצל": "fruits-vegetables", "שום": "fruits-vegetables", "פלפל": "fruits-vegetables",
  "לימון": "fruits-vegetables", "אבוקדו": "fruits-vegetables", "תפוחי אדמה": "fruits-vegetables",
  "תפו\"א": "fruits-vegetables", "ענבים": "fruits-vegetables", "אבטיח": "fruits-vegetables",
  "מנגו": "fruits-vegetables", "תות": "fruits-vegetables", "תותים": "fruits-vegetables",
  "אפרסק": "fruits-vegetables", "שזיף": "fruits-vegetables", "קישוא": "fruits-vegetables",
  "חציל": "fruits-vegetables", "חצילים": "fruits-vegetables", "כרוב": "fruits-vegetables",
  "ברוקולי": "fruits-vegetables", "כרובית": "fruits-vegetables", "פטרוזיליה": "fruits-vegetables",
  "כוסברה": "fruits-vegetables", "נענע": "fruits-vegetables", "שמיר": "fruits-vegetables",
  "בטטה": "fruits-vegetables", "פירות": "fruits-vegetables", "ירקות": "fruits-vegetables",
  "סלט": "fruits-vegetables", "רוקט": "fruits-vegetables", "תרד": "fruits-vegetables",
  "אננס": "fruits-vegetables", "קלמנטינה": "fruits-vegetables", "פומלה": "fruits-vegetables",
  "רימון": "fruits-vegetables", "דלעת": "fruits-vegetables", "סלרי": "fruits-vegetables",

  // Dairy
  "חלב": "dairy", "גבינה": "dairy", "יוגורט": "dairy", "שמנת": "dairy",
  "קוטג": "dairy", "קוטג'": "dairy", "לבן": "dairy", "שוקו": "dairy",
  "חמאה": "dairy", "ביצים": "dairy", "ביצה": "dairy", "גבינת שמנת": "dairy",
  "מוצרלה": "dairy", "צהובה": "dairy", "גבינה צהובה": "dairy", "עמק": "dairy",
  "דנונה": "dairy", "מילקי": "dairy", "פודינג": "dairy",

  // Meat & fish
  "עוף": "meat-fish", "חזה עוף": "meat-fish", "בשר": "meat-fish",
  "סטייק": "meat-fish", "קבב": "meat-fish", "המבורגר": "meat-fish",
  "נקניק": "meat-fish", "נקניקיות": "meat-fish", "שניצל": "meat-fish",
  "דג": "meat-fish", "סלמון": "meat-fish", "טונה": "meat-fish",
  "פילה": "meat-fish", "כבד": "meat-fish", "טחינה": "meat-fish",
  "הודו": "meat-fish", "בקר": "meat-fish",

  // Bread & bakery
  "לחם": "bread-bakery", "פיתה": "bread-bakery", "פיתות": "bread-bakery",
  "חלה": "bread-bakery", "לחמניה": "bread-bakery", "לחמניות": "bread-bakery",
  "בייגל": "bread-bakery", "טורטיה": "bread-bakery", "עוגה": "bread-bakery",
  "עוגיות": "bread-bakery", "קרואסון": "bread-bakery", "מאפה": "bread-bakery",

  // Drinks
  "מים": "drinks", "מיץ": "drinks", "קולה": "drinks", "בירה": "drinks",
  "יין": "drinks", "סודה": "drinks", "קפה": "drinks", "תה": "drinks",
  "ספרייט": "drinks", "פנטה": "drinks", "אנרגיה": "drinks",

  // Snacks
  "חטיף": "snacks", "במבה": "snacks", "ביסלי": "snacks", "שוקולד": "snacks",
  "סוכריות": "snacks", "אגוזים": "snacks", "שקדים": "snacks", "בוטנים": "snacks",
  "צ'יפס": "snacks", "קרקר": "snacks", "גלידה": "snacks", "וופל": "snacks",
  "פופקורן": "snacks",

  // Frozen
  "קפוא": "frozen", "קפואים": "frozen", "פיצה": "frozen", "בורקס": "frozen",
  "שניצלים": "frozen",

  // Cleaning
  "אקונומיקה": "cleaning", "סבון כלים": "cleaning", "סבון": "cleaning",
  "נוזל כלים": "cleaning", "אבקת כביסה": "cleaning", "כביסה": "cleaning",
  "מרכך": "cleaning", "שקיות אשפה": "cleaning", "ספוג": "cleaning",
  "מגב": "cleaning", "נייר טואלט": "cleaning", "מגבונים": "cleaning",
  "נייר סופג": "cleaning",

  // Hygiene
  "שמפו": "hygiene", "מרכך שיער": "hygiene", "דאודורנט": "hygiene",
  "משחת שיניים": "hygiene", "מברשת שיניים": "hygiene", "קרם": "hygiene",
  "תחבושות": "hygiene",

  // Spices & canned
  "מלח": "spices-canned", "פלפל שחור": "spices-canned", "פפריקה": "spices-canned",
  "כורכום": "spices-canned", "קימון": "spices-canned", "רסק עגבניות": "spices-canned",
  "שימורים": "spices-canned", "זיתים": "spices-canned", "חומוס": "spices-canned",
  "תירס": "spices-canned", "שמן": "spices-canned", "שמן זית": "spices-canned",
  "חומץ": "spices-canned", "סויה": "spices-canned", "קטשופ": "spices-canned",
  "חרדל": "spices-canned", "מיונז": "spices-canned",

  // Grains & pasta
  "אורז": "grains-pasta", "פסטה": "grains-pasta", "אטריות": "grains-pasta",
  "קוסקוס": "grains-pasta", "בורגול": "grains-pasta", "קינואה": "grains-pasta",
  "קמח": "grains-pasta", "סוכר": "grains-pasta", "קורנפלקס": "grains-pasta",
  "שיבולת שועל": "grains-pasta", "גרנולה": "grains-pasta", "עדשים": "grains-pasta",

  // Baby
  "חיתולים": "baby", "מטרנה": "baby", "סימילאק": "baby", "מוצץ": "baby",
  "בקבוק תינוק": "baby", "מזון תינוקות": "baby",
};

// Falls back to `categories`' own "other" entry (or its last entry) instead
// of the global default, so a list with a custom category set never shows a
// key that doesn't belong to it.
function fallbackCategory(categories: GroceryCategory[]): GroceryCategory {
  return categories.find((c) => c.key === "other") ?? categories[categories.length - 1];
}

export function getCategoryForItem(
  name: string,
  categories: GroceryCategory[] = CATEGORIES,
): GroceryCategory {
  const normalized = name.trim().toLowerCase();

  const byKey = (key: string) => categories.find((c) => c.key === key);

  // Try exact match first
  if (KEYWORD_MAP[normalized]) {
    const match = byKey(KEYWORD_MAP[normalized]);
    if (match) return match;
  } else {
    // Try partial match (item name contains keyword or keyword contains item name)
    for (const [keyword, categoryKey] of Object.entries(KEYWORD_MAP)) {
      if (normalized.includes(keyword) || keyword.includes(normalized)) {
        const match = byKey(categoryKey);
        if (match) return match;
        break;
      }
    }
  }

  return fallbackCategory(categories);
}

export function getCategory(
  key: string,
  categories: GroceryCategory[] = CATEGORIES,
): GroceryCategory {
  return categories.find((c) => c.key === key) ?? fallbackCategory(categories);
}

// Returns fresh copies, never the shared default array — callers (e.g. a
// category manager's "reset to default" action) hold these in editable local
// state, and in-place edits must never leak back into the app's defaults.
export function getAllCategories(): GroceryCategory[] {
  return CATEGORIES.map((c) => ({ ...c }));
}

// Ordered category keys for display
export const CATEGORY_ORDER = CATEGORIES.map((c) => c.key);

// Resolves a list's saved custom order (if any) into a full, display-ready
// order — falling back to the default, and appending any categories the
// custom order doesn't know about yet (e.g. if new categories are added
// after the order was saved).
export function resolveCategoryOrder(customOrder: string[] | null | undefined): string[] {
  if (!customOrder || customOrder.length === 0) return CATEGORY_ORDER;
  return [...customOrder, ...CATEGORY_ORDER.filter((k) => !customOrder.includes(k))];
}

// Single source of truth for "what categories does this list have, in what
// order": a list's own custom `categories` set when it has one (guaranteed
// to include "other"), otherwise the default 13 categories, optionally
// reordered via the legacy `categoryOrder` — i.e. unchanged behavior for any
// list that has never opened the category manager.
export function resolveListCategories(
  list:
    | { categories?: GroceryCategory[] | null; categoryOrder?: string[] | null }
    | null
    | undefined,
): GroceryCategory[] {
  if (list?.categories && list.categories.length > 0) {
    const hasOther = list.categories.some((c) => c.key === "other");
    return hasOther ? list.categories : [...list.categories, getCategory("other")];
  }
  return resolveCategoryOrder(list?.categoryOrder ?? null).map((key) => getCategory(key));
}

// Derives a stable, URL/DB-safe key from a free-text category label
// (Hebrew-aware: \p{L} matches Hebrew letters), unique among `existingKeys`.
// Generated once when a category is added and never changes on rename — only
// its label/emoji change — so items already assigned to it keep matching.
export function generateCategoryKey(label: string, existingKeys: string[]): string {
  const base =
    label
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "category";
  if (!existingKeys.includes(base)) return base;
  let n = 2;
  while (existingKeys.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
