import { useEffect, useState, useCallback } from "react";

const PHONE_KEY = "grocery-phone-number";
const LIST_KEY_PREFIX = "grocery-current-list:";

export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

export function usePhone() {
  const [phone, setPhoneState] = useState<string | null>(null);
  const [currentListId, setCurrentListIdState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = localStorage.getItem(PHONE_KEY);
    setPhoneState(p);
    if (p) setCurrentListIdState(localStorage.getItem(LIST_KEY_PREFIX + p));
    setLoaded(true);
  }, []);

  const setPhone = useCallback((value: string) => {
    const normalized = normalizePhone(value);
    localStorage.setItem(PHONE_KEY, normalized);
    setPhoneState(normalized);
    setCurrentListIdState(localStorage.getItem(LIST_KEY_PREFIX + normalized));
  }, []);

  const clearPhone = useCallback(() => {
    localStorage.removeItem(PHONE_KEY);
    setPhoneState(null);
    setCurrentListIdState(null);
  }, []);

  const setCurrentListId = useCallback(
    (id: string | null) => {
      if (!phone) return;
      if (id) localStorage.setItem(LIST_KEY_PREFIX + phone, id);
      else localStorage.removeItem(LIST_KEY_PREFIX + phone);
      setCurrentListIdState(id);
    },
    [phone],
  );

  return { phone, loaded, setPhone, clearPhone, currentListId, setCurrentListId };
}
