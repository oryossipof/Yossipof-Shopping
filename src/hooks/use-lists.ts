import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { readCachedLists, writeCachedLists, clearCachedItems } from "@/lib/offline-cache";

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  categoryOrder: string[] | null;
}

interface DbRow {
  id: string;
  name: string;
  created_at: string;
  category_order: string[] | null;
}

function rowToList(row: DbRow): ShoppingList {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).getTime(),
    categoryOrder: row.category_order ?? null,
  };
}

export function useLists(
  phone: string | null,
  currentListId: string | null,
  setCurrentListId: (id: string | null) => void,
) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ensuringRef = useRef(false);
  const phoneRef = useRef(phone);
  phoneRef.current = phone;

  useEffect(() => {
    if (!phone) {
      setLists([]);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    setLoaded(false);

    // Show the cached lists right away; refresh from the server below.
    const cached = readCachedLists(phone);
    if (cached?.length) {
      setLists(cached);
      if (!currentListId || !cached.find((l) => l.id === currentListId)) {
        setCurrentListId(cached[0].id);
      }
      setLoaded(true);
    }

    (async () => {
      const { data } = await supabase
        .from("saved_lists")
        .select("id,name,created_at,category_order")
        .eq("phone_number", phone)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      let rows = (data ?? []).map((r) => rowToList(r as DbRow));

      // Ensure at least one list exists
      if (rows.length === 0 && !cached?.length && !ensuringRef.current) {
        ensuringRef.current = true;
        const { data: created } = await supabase
          .from("saved_lists")
          .insert({ phone_number: phone, name: "הרשימה שלי", items: [] })
          .select("id,name,created_at,category_order")
          .single();
        ensuringRef.current = false;
        if (created) rows = [rowToList(created as DbRow)];
      }
      // An offline read returns no rows; keep the cached lists rather than
      // wiping the UI and creating a duplicate "my list" on the next sync.
      if (rows.length === 0 && cached?.length) {
        setLoaded(true);
        return;
      }

      setLists(rows);
      writeCachedLists(phone, rows);

      // Ensure current list id is valid
      if (!currentListId || !rows.find((l) => l.id === currentListId)) {
        setCurrentListId(rows[0]?.id ?? null);
      }
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const createList = useCallback(
    async (name: string) => {
      if (!phone) return null;
      const { data } = await supabase
        .from("saved_lists")
        .insert({ phone_number: phone, name: name.trim() || "רשימה חדשה", items: [] })
        .select("id,name,created_at,category_order")
        .single();
      if (!data) return null;
      const list = rowToList(data as DbRow);
      setLists((prev) => {
        const next = [...prev, list];
        writeCachedLists(phone, next);
        return next;
      });
      setCurrentListId(list.id);
      return list;
    },
    [phone, setCurrentListId],
  );

  const renameList = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLists((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, name: trimmed } : l));
      writeCachedLists(phoneRef.current, next);
      return next;
    });
    await supabase.from("saved_lists").update({ name: trimmed }).eq("id", id);
  }, []);

  const updateCategoryOrder = useCallback(async (id: string, order: string[] | null) => {
    setLists((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, categoryOrder: order } : l));
      writeCachedLists(phoneRef.current, next);
      return next;
    });
    await supabase.from("saved_lists").update({ category_order: order }).eq("id", id);
  }, []);

  const deleteList = useCallback(
    async (id: string) => {
      const remaining = lists.filter((l) => l.id !== id);
      setLists(remaining);
      writeCachedLists(phone, remaining);
      clearCachedItems(id);
      await supabase.from("saved_lists").delete().eq("id", id);

      if (currentListId === id) {
        if (remaining.length > 0) {
          setCurrentListId(remaining[0].id);
        } else if (phone) {
          const { data } = await supabase
            .from("saved_lists")
            .insert({ phone_number: phone, name: "הרשימה שלי", items: [] })
            .select("id,name,created_at,category_order")
            .single();
          if (data) {
            const list = rowToList(data as DbRow);
            setLists([list]);
            setCurrentListId(list.id);
          }
        }
      }
    },
    [lists, currentListId, phone, setCurrentListId],
  );

  return { lists, loaded, createList, renameList, deleteList, updateCategoryOrder };
}
