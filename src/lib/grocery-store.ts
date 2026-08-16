export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  imageUrl?: string;
  checked: boolean;
  addedAt: number;
  category?: string;
  notes?: string;
}

export interface SavedList {
  id: string;
  name: string;
  createdAt: number;
  items: Omit<GroceryItem, "checked">[];
}
