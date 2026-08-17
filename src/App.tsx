import { useState, useMemo, useEffect } from "react";
import { useGroceryList } from "@/hooks/use-grocery-list";
import { useLists } from "@/hooks/use-lists";
import { AddItemForm } from "@/components/AddItemForm";
import { GroceryItemCard } from "@/components/GroceryItemCard";
import { ListSwitcher } from "@/components/ListSwitcher";
import { ImportItemsDialog } from "@/components/ImportItemsDialog";
import { ImportFromListDialog } from "@/components/ImportFromListDialog";
import { ExportListDialog } from "@/components/ExportListDialog";
import { NotifyDialog } from "@/components/NotifyDialog";
import { CategoryManagerDialog } from "@/components/CategoryManagerDialog";
import { PhoneGate } from "@/components/PhoneGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategoryForItem, resolveListCategories } from "@/lib/grocery-categories";
import type { GroceryItem } from "@/lib/grocery-store";
import { usePhone } from "@/lib/use-phone";

function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}

export default function App() {
  const { phone, loaded: phoneLoaded, setPhone, clearPhone, currentListId, setCurrentListId } =
    usePhone();
  const {
    lists,
    loaded: listsLoaded,
    createList,
    renameList,
    deleteList,
    updateListCategories,
  } = useLists(phone, currentListId, setCurrentListId);
  const currentList = lists.find((l) => l.id === currentListId);

  const activeCategories = useMemo(
    () => resolveListCategories(currentList),
    [currentList?.categories, currentList?.categoryOrder],
  );

  const {
    items,
    loaded,
    addItem,
    importItems,
    toggleItem,
    removeItem,
    clearChecked,
    editItem,
    reclassifyListCategories,
  } = useGroceryList(phone, currentListId, activeCategories);
  const online = useOnline();
  const [showLists, setShowLists] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showImportFromList, setShowImportFromList] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [managerListId, setManagerListId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hideChecked, setHideChecked] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const managerList = lists.find((l) => l.id === managerListId);
  const uncheckedCount = items.filter((i) => !i.checked).length;
  const checkedCount = items.filter((i) => i.checked).length;

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      set.add(item.category ?? getCategoryForItem(item.name, activeCategories).key);
    }
    return activeCategories.filter((c) => set.has(c.key));
  }, [items, activeCategories]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = items;
    if (hideChecked) result = result.filter((i) => !i.checked);
    if (categoryFilter) {
      result = result.filter(
        (i) => (i.category ?? getCategoryForItem(i.name, activeCategories).key) === categoryFilter,
      );
    }
    if (q) result = result.filter((i) => i.name.toLowerCase().includes(q));
    return result;
  }, [items, search, hideChecked, categoryFilter, activeCategories]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {};
    for (const item of filteredItems) {
      const catKey = item.category ?? getCategoryForItem(item.name, activeCategories).key;
      if (!groups[catKey]) groups[catKey] = [];
      groups[catKey].push(item);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => Number(a.checked) - Number(b.checked));
    }
    return activeCategories
      .filter((c) => groups[c.key]?.length)
      .map((c) => ({ category: c, items: groups[c.key] }));
  }, [filteredItems, activeCategories]);

  if (!phoneLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!phone) {
    return <PhoneGate onSubmit={setPhone} />;
  }

  if (!listsLoaded || !loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!online && (
        <div className="sticky top-0 z-50 bg-amber-100 text-amber-900 text-xs text-center py-1.5 px-3">
          אין חיבור לאינטרנט — הרשימה מוצגת מהזיכרון. שינויים לא יישמרו.
        </div>
      )}

      {/* Sticky header (with list selector + search) */}
      <header
        className="sticky z-40 bg-background/95 backdrop-blur-md border-b border-border"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-lg sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex items-center gap-2 min-w-0">
              <span className="text-xl">🛒</span>
              <button
                onClick={() => setShowLists((v) => !v)}
                className="flex items-center gap-1 min-w-0 text-right group"
              >
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-bold text-foreground leading-tight truncate max-w-[160px] sm:max-w-none">
                    {currentList?.name ?? "רשימת קניות"}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {lists.length} רשימות · החלף
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {showLists && (
                <ListSwitcher
                  lists={lists}
                  currentListId={currentListId}
                  onSelect={setCurrentListId}
                  onCreate={(name) => createList(name)}
                  onDelete={deleteList}
                  onRename={renameList}
                  onEditCategories={(id) => {
                    setShowLists(false);
                    setManagerListId(id);
                  }}
                  onClose={() => setShowLists(false)}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowImport(true)}
                className="text-[10px] text-muted-foreground hover:text-foreground rounded-md px-1.5 py-1 hover:bg-muted"
                aria-label="ייבוא מקובץ"
                title="ייבוא רשימה מקובץ"
              >
                📥 ייבוא
              </button>
              {lists.length > 1 && (
                <button
                  onClick={() => setShowImportFromList(true)}
                  className="text-[10px] text-muted-foreground hover:text-foreground rounded-md px-1.5 py-1 hover:bg-muted"
                  aria-label="ייבוא מרשימה קיימת"
                  title="ייבוא פריטים מרשימה אחרת"
                >
                  📋 מרשימה
                </button>
              )}
              {items.length > 0 && (
                <button
                  onClick={() => setShowExport(true)}
                  className="text-[10px] text-muted-foreground hover:text-foreground rounded-md px-1.5 py-1 hover:bg-muted"
                  aria-label="ייצוא רשימה"
                  title="ייצוא / שיתוף הרשימה"
                >
                  📤 ייצוא
                </button>
              )}
              <button
                onClick={() => setShowNotify(true)}
                className="text-[10px] text-muted-foreground hover:text-foreground rounded-md px-1.5 py-1 hover:bg-muted"
                aria-label="שליחת עדכון בוואטסאפ"
                title="הודעה שסיימת לעדכן / לקנות"
              >
                💬 עדכון
              </button>
              <button
                onClick={clearPhone}
                className="text-[10px] text-muted-foreground hover:text-foreground"
                aria-label="החלף מספר טלפון"
              >
                📱 {phone}
              </button>
            </div>
          </div>

          {/* Add item form — always visible */}
          <AddItemForm onAdd={addItem} />

          {/* Sticky search */}
          {items.length > 0 && (
            <div className="relative">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 חיפוש ברשימה..."
                className="pr-3 text-right h-9"
                dir="rtl"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs px-2"
                  aria-label="נקה חיפוש"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Category filter chips */}
          {availableCategories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5 scrollbar-none">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  categoryFilter === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                הכל
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter((prev) => (prev === cat.key ? null : cat.key))}
                  className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                    categoryFilter === cat.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-8 space-y-4">
        {items.length > 0 && (
          <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {uncheckedCount} פריטים נותרו
              {checkedCount > 0 && ` · ${checkedCount} נקנו`}
            </p>
            <div className="flex gap-1">
              {checkedCount > 0 && (
                <Button
                  variant={hideChecked ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setHideChecked((v) => !v)}
                  className="text-xs"
                >
                  {hideChecked ? "הצג הכל" : "הצג רק שלא נקנו"}
                </Button>
              )}
              {checkedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearChecked} className="text-xs">
                  נקה שנקנו
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
          {groupedItems.map(({ category, items: catItems }) => (
            <div key={category.key} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1 pt-2">
                <span className="text-base">{category.emoji}</span>
                <p className="text-xs font-semibold text-muted-foreground">{category.label}</p>
              </div>
              {catItems.map((item) => (
                <GroceryItemCard
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onRemove={removeItem}
                  onEdit={editItem}
                />
              ))}
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <span className="text-5xl block">🥑</span>
            <p className="text-lg font-medium text-foreground">הרשימה ריקה</p>
            <p className="text-sm text-muted-foreground">הוסיפי מוצרים למעלה</p>
          </div>
        )}
        {items.length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <span className="text-4xl block">🔍</span>
            <p className="text-sm text-muted-foreground">
              {search ? `לא נמצאו פריטים עבור "${search}"` : "אין פריטים בקטגוריה הזו"}
            </p>
          </div>
        )}
      </main>

      <ImportItemsDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={importItems}
      />

      <ImportFromListDialog
        open={showImportFromList}
        onClose={() => setShowImportFromList(false)}
        lists={lists}
        currentListId={currentListId}
        phone={phone}
        onImport={importItems}
      />

      <NotifyDialog
        open={showNotify}
        onClose={() => setShowNotify(false)}
        listName={currentList?.name ?? "רשימת קניות"}
        phone={phone}
      />

      <ExportListDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        listName={currentList?.name ?? "רשימת קניות"}
        items={items}
        categories={activeCategories}
      />

      <CategoryManagerDialog
        open={!!managerListId}
        onClose={() => setManagerListId(null)}
        listName={managerList?.name ?? ""}
        initialCategories={managerList?.categories ?? null}
        initialOrder={managerList?.categoryOrder ?? null}
        onSave={(categories, deletedKeys, contentChanged) => {
          if (!managerListId) return;
          updateListCategories(managerListId, categories);
          if (contentChanged) {
            reclassifyListCategories(managerListId, deletedKeys, categories);
          }
        }}
      />
    </div>
  );
}
