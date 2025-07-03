import type { ClothingItem, Outfit, OutfitHistory } from "@shared/schema";

const STORAGE_KEYS = {
  ITEMS: 'closet_concierge_items',
  OUTFITS: 'closet_concierge_outfits',
  HISTORY: 'closet_concierge_history',
};

export class LocalStorage {
  static getItems(): ClothingItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveItems(items: ClothingItem[]): void {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }

  static addItem(item: ClothingItem): void {
    const items = this.getItems();
    items.push(item);
    this.saveItems(items);
  }

  static updateItem(id: number, updates: Partial<ClothingItem>): void {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.saveItems(items);
    }
  }

  static deleteItem(id: number): void {
    const items = this.getItems();
    const filtered = items.filter(item => item.id !== id);
    this.saveItems(filtered);
  }

  static getOutfits(): Outfit[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OUTFITS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveOutfits(outfits: Outfit[]): void {
    localStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(outfits));
  }

  static addOutfit(outfit: Outfit): void {
    const outfits = this.getOutfits();
    outfits.push(outfit);
    this.saveOutfits(outfits);
  }

  static getHistory(): OutfitHistory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveHistory(history: OutfitHistory[]): void {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  static addHistory(entry: OutfitHistory): void {
    const history = this.getHistory();
    history.push(entry);
    this.saveHistory(history);
  }

  static getRecentHistory(days: number): OutfitHistory[] {
    const history = this.getHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return history.filter(entry => {
      const entryDate = new Date(entry.wornDate || '');
      return entryDate >= cutoffDate;
    });
  }
}
