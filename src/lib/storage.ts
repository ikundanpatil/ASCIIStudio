export interface SavedArt {
  id: string;
  type: "image" | "text";
  title: string;
  ascii: string;
  createdAt: number;
}

const KEY = "ascii-art-gallery-v1";

export function loadGallery(): SavedArt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedArt[];
  } catch {
    return [];
  }
}

export function saveGallery(items: SavedArt[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToGallery(item: Omit<SavedArt, "id" | "createdAt">): SavedArt {
  const full: SavedArt = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const items = [full, ...loadGallery()];
  saveGallery(items);
  return full;
}

export function removeFromGallery(id: string): SavedArt[] {
  const items = loadGallery().filter((i) => i.id !== id);
  saveGallery(items);
  return items;
}

export function clearGallery() {
  saveGallery([]);
}
