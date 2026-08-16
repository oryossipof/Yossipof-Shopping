// Caches the last-seen state of each list in localStorage so the app opens
// instantly and still shows the list when there is no signal (e.g. inside a
// supermarket). This is a display cache only — Supabase remains the source of
// truth, and it overwrites the cache as soon as a request succeeds.

import type { GroceryItem } from "./grocery-store";

const ITEMS_PREFIX = "grocery-cache-items:";
const LISTS_PREFIX = "grocery-cache-lists:";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — the app works fine without the cache.
  }
}

export function readCachedItems(listId: string | null): GroceryItem[] | null {
  if (!listId) return null;
  return read<GroceryItem[]>(ITEMS_PREFIX + listId);
}

export function writeCachedItems(listId: string | null, items: GroceryItem[]): void {
  if (!listId) return;
  write(ITEMS_PREFIX + listId, items);
}

export function clearCachedItems(listId: string): void {
  try {
    localStorage.removeItem(ITEMS_PREFIX + listId);
  } catch {
    // Ignore.
  }
}

export interface CachedList {
  id: string;
  name: string;
  createdAt: number;
}

export function readCachedLists(phone: string | null): CachedList[] | null {
  if (!phone) return null;
  return read<CachedList[]>(LISTS_PREFIX + phone);
}

export function writeCachedLists(phone: string | null, lists: CachedList[]): void {
  if (!phone) return;
  write(LISTS_PREFIX + phone, lists);
}
