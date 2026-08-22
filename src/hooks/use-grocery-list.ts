import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GroceryItem } from "@/lib/grocery-store";
import { getCategoryForItem, type GroceryCategory } from "@/lib/grocery-categories";
import { readCachedItems, writeCachedItems } from "@/lib/offline-cache";
import { classifyItemsWithAI } from "@/lib/ai-classify";
import { normalizeProductName } from "@/lib/normalize-name";

interface DbRow {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  image_url: string | null;
  checked: boolean;
  category: string | null;
  added_at: string;
  list_id: string | null;
  notes: string | null;
}

export interface ImportEntry {
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  imageUrl?: string;
}

/** Outcome of a write that can be refused because the name is already taken. */
export type WriteResult = { ok: true } | { ok: false; reason: "duplicate" };

export interface ImportResult {
  added: number;
  /** Entries dropped because that product is already in the list. */
  skipped: number;
}

function rowToItem(row: DbRow): GroceryItem {
  return {
    id: row.id,
    name: row.name,
    quantity: Number(row.quantity),
    unit: row.unit,
    imageUrl: row.image_url ?? undefined,
    checked: row.checked,
    category: row.category ?? undefined,
    addedAt: new Date(row.added_at).getTime(),
    notes: row.notes ?? undefined,
  };
}

export function useGroceryList(
  phone: string | null,
  listId: string | null,
  categories: GroceryCategory[],
) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const phoneRef = useRef(phone);
  const listIdRef = useRef(listId);
  const categoriesRef = useRef(categories);
  // Lets the write callbacks see the current list without taking `items` as a
  // dependency, which would give them a new identity on every change.
  const itemsRef = useRef(items);
  phoneRef.current = phone;
  listIdRef.current = listId;
  categoriesRef.current = categories;
  itemsRef.current = items;

  // A product counts as already in the list whatever its state — including one
  // already ticked off as bought. `exceptId` skips the item being renamed, so
  // re-saving an item under its own name is never treated as a duplicate.
  const isDuplicateName = useCallback((name: string, exceptId?: string) => {
    const normalized = normalizeProductName(name);
    if (!normalized) return false;
    return itemsRef.current.some(
      (i) => i.id !== exceptId && normalizeProductName(i.name) === normalized,
    );
  }, []);

  useEffect(() => {
    if (!phone || !listId) {
      setItems([]);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    setLoaded(false);

    // Paint the cached list immediately so the app is usable before (and
    // without) a network round-trip.
    const cached = readCachedItems(listId);
    if (cached) {
      setItems(cached);
      setLoaded(true);
    }

    (async () => {
      const { data, error } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("phone_number", phone)
        .eq("list_id", listId)
        .order("added_at", { ascending: false });
      if (cancelled) return;
      if (!error && data) {
        const fresh = data.map((r) => rowToItem(r as DbRow));
        setItems(fresh);
        writeCachedItems(listId, fresh);
      }
      setLoaded(true);
    })();

    const channel = supabase
      .channel(`grocery-${phone}-${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_items",
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as DbRow;
            setItems((prev) =>
              prev.find((i) => i.id === row.id) ? prev : [rowToItem(row), ...prev],
            );
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as DbRow;
            setItems((prev) => prev.map((i) => (i.id === row.id ? rowToItem(row) : i)));
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as { id: string };
            setItems((prev) => prev.filter((i) => i.id !== row.id));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [phone, listId]);

  // Fires a background AI classification for a single item and, if it
  // disagrees with the category already on the row, updates it in Supabase.
  // The realtime subscription above then syncs the correction into `items`.
  // Never awaited by callers — a best-effort refinement of the instant local
  // keyword guess, safe to fail silently offline or on API errors.
  const refineCategory = useCallback((id: string, name: string, currentCategory: string) => {
    classifyItemsWithAI([name], categoriesRef.current).then(async (map) => {
      const aiCategory = map[name];
      if (aiCategory && aiCategory !== currentCategory) {
        // supabase-js query builders only actually dispatch the request once
        // their thenable is consumed, so this await is required, not optional.
        await supabase.from("grocery_items").update({ category: aiCategory }).eq("id", id);
      }
    });
  }, []);

  const addItem = useCallback(
    async (
      name: string,
      quantity: number,
      unit: string,
      imageUrl?: string,
      notes?: string,
    ): Promise<WriteResult> => {
      if (!phoneRef.current || !listIdRef.current) return { ok: true };
      if (isDuplicateName(name)) return { ok: false, reason: "duplicate" };
      const initialCategory = getCategoryForItem(name, categoriesRef.current);
      const { data, error } = await supabase
        .from("grocery_items")
        .insert({
          phone_number: phoneRef.current,
          list_id: listIdRef.current,
          name,
          quantity,
          unit,
          image_url: imageUrl ?? null,
          category: initialCategory.key,
          checked: false,
          notes: notes?.trim() ? notes.trim() : null,
        })
        .select()
        .single();
      if (error || !data) return { ok: true };
      const item = rowToItem(data as DbRow);
      setItems((prev) => (prev.find((i) => i.id === item.id) ? prev : [item, ...prev]));
      refineCategory(item.id, name, initialCategory.key);
      return { ok: true };
    },
    [refineCategory, isDuplicateName],
  );

  const importItems = useCallback(async (entries: (string | ImportEntry)[]): Promise<ImportResult> => {
    if (!phoneRef.current || !listIdRef.current || entries.length === 0) {
      return { added: 0, skipped: 0 };
    }
    const all: ImportEntry[] = entries.map((e) => (typeof e === "string" ? { name: e } : e));

    // Drop anything already in the list, and anything the incoming batch
    // repeats within itself — a pasted list often names the same product twice.
    const seen = new Set(itemsRef.current.map((i) => normalizeProductName(i.name)));
    const normalized: ImportEntry[] = [];
    for (const entry of all) {
      const key = normalizeProductName(entry.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      normalized.push(entry);
    }
    const skipped = all.length - normalized.length;
    if (normalized.length === 0) return { added: 0, skipped };

    const rows = normalized.map((e) => ({
      phone_number: phoneRef.current!,
      list_id: listIdRef.current!,
      name: e.name,
      quantity: e.quantity ?? 1,
      unit: e.unit ?? "יח׳",
      image_url: e.imageUrl ?? null,
      category: getCategoryForItem(e.name, categoriesRef.current).key,
      checked: false,
      notes: e.notes?.trim() ? e.notes.trim() : null,
    }));

    const { data, error } = await supabase.from("grocery_items").insert(rows).select();
    if (error || !data) return { added: 0, skipped };
    const newItems = data.map((r) => rowToItem(r as DbRow));
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.id));
      const fresh = newItems.filter((i) => !existing.has(i.id));
      return [...fresh, ...prev];
    });

    // Background batch refinement: ask AI for every imported name at once,
    // then correct any rows whose local keyword guess it disagrees with.
    classifyItemsWithAI(newItems.map((i) => i.name), categoriesRef.current).then(async (map) => {
      for (const item of newItems) {
        const aiCategory = map[item.name];
        if (aiCategory && aiCategory !== item.category) {
          // supabase-js query builders only actually dispatch the request
          // once their thenable is consumed, so this await is required.
          await supabase.from("grocery_items").update({ category: aiCategory }).eq("id", item.id);
        }
      }
    });

    return { added: newItems.length, skipped };
  }, []);

  const toggleItem = useCallback(
    async (id: string) => {
      const current = items.find((i) => i.id === id);
      if (!current) return;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
      await supabase.from("grocery_items").update({ checked: !current.checked }).eq("id", id);
    },
    [items],
  );

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("grocery_items").delete().eq("id", id);
  }, []);

  const clearChecked = useCallback(async () => {
    if (!phoneRef.current || !listIdRef.current) return;
    setItems((prev) => prev.filter((i) => !i.checked));
    await supabase
      .from("grocery_items")
      .delete()
      .eq("list_id", listIdRef.current)
      .eq("checked", true);
  }, []);

  const editItem = useCallback(
    async (
      id: string,
      updates: Partial<Pick<GroceryItem, "name" | "quantity" | "unit" | "notes">>,
    ): Promise<WriteResult> => {
      const current = items.find((i) => i.id === id);
      if (!current) return { ok: true };
      if (updates.name !== undefined && isDuplicateName(updates.name, id)) {
        return { ok: false, reason: "duplicate" };
      }
      const dbUpdates: {
        name?: string;
        category?: string;
        quantity?: number;
        unit?: string;
        notes?: string | null;
      } = {};
      if (updates.name !== undefined) {
        dbUpdates.name = updates.name;
        if (updates.name !== current.name) {
          dbUpdates.category = getCategoryForItem(updates.name, categoriesRef.current).key;
        }
      }
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.notes !== undefined) {
        const trimmed = updates.notes?.trim() ?? "";
        dbUpdates.notes = trimmed ? trimmed : null;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                ...updates,
                notes:
                  updates.notes !== undefined
                    ? updates.notes?.trim()
                      ? updates.notes.trim()
                      : undefined
                    : i.notes,
                category:
                  (dbUpdates.category as string | undefined) ?? i.category,
              }
            : i,
        ),
      );
      await supabase.from("grocery_items").update(dbUpdates).eq("id", id);
      if (dbUpdates.category !== undefined && updates.name !== undefined) {
        refineCategory(id, updates.name, dbUpdates.category);
      }
      return { ok: true };
    },
    [items, refineCategory, isDuplicateName],
  );

  // Called when a list's category set is saved with any content change
  // (a category added, renamed, or deleted — not a pure reorder). Any list —
  // the category manager can be opened for a list that isn't the currently-
  // open one, so this talks to Supabase directly rather than relying on
  // `items` state, which only reflects `listId`.
  //
  // First, items whose category was just deleted are immediately reassigned
  // to "other" (awaited, so nothing goes invisible in the UI the instant the
  // category set is saved). Then EVERY item in the list — not just the
  // reassigned ones — goes through a background AI reclassification pass
  // against the new category set: a renamed or newly-added category can be a
  // better fit for items that were already sitting under a different one.
  const reclassifyListCategories = useCallback(
    async (targetListId: string, deletedKeys: string[], categories: GroceryCategory[]) => {
      if (!phoneRef.current) return;

      if (deletedKeys.length > 0) {
        const { data: reassigned } = await supabase
          .from("grocery_items")
          .update({ category: "other" })
          .eq("phone_number", phoneRef.current)
          .eq("list_id", targetListId)
          .in("category", deletedKeys)
          .select("id");
        if (reassigned && reassigned.length > 0 && targetListId === listIdRef.current) {
          const ids = new Set(reassigned.map((r) => r.id));
          setItems((prev) => prev.map((i) => (ids.has(i.id) ? { ...i, category: "other" } : i)));
        }
      }

      const { data: allItems } = await supabase
        .from("grocery_items")
        .select("id,name,category")
        .eq("phone_number", phoneRef.current)
        .eq("list_id", targetListId);
      if (!allItems || allItems.length === 0) return;

      // Fire-and-forget: the realtime subscription (for the currently-open
      // list) or a later refetch picks up each correction as it lands.
      classifyItemsWithAI(
        allItems.map((r) => r.name),
        categories,
      ).then(async (map) => {
        for (const row of allItems) {
          const aiCategory = map[row.name];
          if (aiCategory && aiCategory !== row.category) {
            // supabase-js query builders only actually dispatch the request
            // once their thenable is consumed, so this await is required.
            await supabase.from("grocery_items").update({ category: aiCategory }).eq("id", row.id);
          }
        }
      });
    },
    [],
  );

  // Mirror every change into the cache so an offline reopen shows the latest
  // state the device knows about.
  useEffect(() => {
    if (!loaded || !listId) return;
    writeCachedItems(listId, items);
  }, [items, loaded, listId]);

  return {
    items,
    loaded,
    addItem,
    importItems,
    toggleItem,
    removeItem,
    clearChecked,
    editItem,
    reclassifyListCategories,
  };
}
