import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { ShoppingList } from "@/hooks/use-lists";
import type { ImportEntry } from "@/hooks/use-grocery-list";

interface SourceItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  image_url: string | null;
}

interface ImportFromListDialogProps {
  open: boolean;
  onClose: () => void;
  lists: ShoppingList[];
  currentListId: string | null;
  phone: string;
  onImport: (entries: ImportEntry[]) => void;
}

export function ImportFromListDialog({
  open,
  onClose,
  lists,
  currentListId,
  phone,
  onImport,
}: ImportFromListDialogProps) {
  const otherLists = useMemo(
    () => lists.filter((l) => l.id !== currentListId),
    [lists, currentListId],
  );
  const [sourceListId, setSourceListId] = useState<string | null>(null);
  const [items, setItems] = useState<SourceItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Pick initial source list when opened
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelected(new Set());
    setSourceListId((prev) => prev && otherLists.find((l) => l.id === prev) ? prev : otherLists[0]?.id ?? null);
  }, [open, otherLists]);

  // Load items from selected source list
  useEffect(() => {
    if (!open || !sourceListId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("grocery_items")
        .select("id,name,quantity,unit,notes,image_url")
        .eq("phone_number", phone)
        .eq("list_id", sourceListId)
        .order("added_at", { ascending: false });
      if (cancelled) return;
      const rows = (data ?? []) as SourceItem[];
      setItems(rows);
      setSelected(new Set());
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sourceListId, phone]);

  if (!open) return null;

  const q = search.trim().toLowerCase();
  const filtered = items.filter((i) =>
    q ? i.name.toLowerCase().includes(q) || (i.notes?.toLowerCase().includes(q) ?? false) : true,
  );

  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((i) => next.delete(i.id));
      else filtered.forEach((i) => next.add(i.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = () => {
    const entries: ImportEntry[] = items
      .filter((i) => selected.has(i.id))
      .map((i) => ({
        name: i.name,
        quantity: Number(i.quantity) || 1,
        unit: i.unit || "יח׳",
        notes: i.notes ?? undefined,
        imageUrl: i.image_url ?? undefined,
      }));
    if (entries.length === 0) return;
    onImport(entries);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">ייבוא מרשימה קיימת</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            aria-label="סגור"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {otherLists.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            אין רשימות אחרות לייבא מהן.
          </div>
        ) : (
          <>
            <div className="p-4 space-y-3 border-b border-border">
              <label className="block text-xs text-muted-foreground">בחר רשימת מקור</label>
              <select
                value={sourceListId ?? ""}
                onChange={(e) => setSourceListId(e.target.value)}
                dir="rtl"
                className="w-full rounded-lg bg-muted px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {otherLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 סנן פריטים..."
                dir="rtl"
                className="w-full rounded-lg bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">טוען…</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">אין פריטים</div>
              ) : (
                <>
                  <button
                    onClick={toggleAll}
                    className="w-full text-right text-xs text-primary px-2 py-1.5 hover:bg-muted rounded-md mb-1"
                  >
                    {allSelected ? "בטל בחירה של כולם" : "בחר את כולם"}
                  </button>
                  <div className="space-y-1">
                    {filtered.map((item) => {
                      const isSel = selected.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleOne(item.id)}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-right transition-colors ${
                            isSel ? "bg-primary/10 border border-primary/30" : "bg-muted/50 hover:bg-muted border border-transparent"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                              isSel ? "bg-primary border-primary" : "border-muted-foreground/30"
                            }`}
                          >
                            {isSel && (
                              <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                          <span className="flex-1 text-sm text-foreground truncate">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t border-border">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                ביטול
              </Button>
              <Button onClick={handleImport} disabled={selected.size === 0} className="flex-1">
                ייבא ({selected.size})
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
