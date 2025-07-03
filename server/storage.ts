import { 
  users, 
  clothingItems, 
  outfits, 
  outfitHistory,
  type User, 
  type InsertUser,
  type ClothingItem,
  type InsertClothingItem,
  type Outfit,
  type InsertOutfit,
  type OutfitHistory,
  type InsertOutfitHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, gte } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getClothingItems(userId: number): Promise<ClothingItem[]>;
  getClothingItem(id: number): Promise<ClothingItem | undefined>;
  createClothingItem(item: InsertClothingItem): Promise<ClothingItem>;
  updateClothingItem(id: number, updates: Partial<ClothingItem>): Promise<ClothingItem | undefined>;
  deleteClothingItem(id: number): Promise<boolean>;
  
  getOutfits(userId: number): Promise<Outfit[]>;
  getOutfit(id: number): Promise<Outfit | undefined>;
  createOutfit(outfit: InsertOutfit): Promise<Outfit>;
  deleteOutfit(id: number): Promise<boolean>;
  
  getOutfitHistory(userId: number): Promise<OutfitHistory[]>;
  createOutfitHistory(history: InsertOutfitHistory): Promise<OutfitHistory>;
  getRecentOutfitHistory(userId: number, days: number): Promise<OutfitHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clothingItems: Map<number, ClothingItem>;
  private outfits: Map<number, Outfit>;
  private outfitHistory: Map<number, OutfitHistory>;
  private currentUserId: number;
  private currentClothingItemId: number;
  private currentOutfitId: number;
  private currentHistoryId: number;

  constructor() {
    this.users = new Map();
    this.clothingItems = new Map();
    this.outfits = new Map();
    this.outfitHistory = new Map();
    this.currentUserId = 1;
    this.currentClothingItemId = 1;
    this.currentOutfitId = 1;
    this.currentHistoryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getClothingItems(userId: number): Promise<ClothingItem[]> {
    return Array.from(this.clothingItems.values()).filter(
      (item) => item.userId === userId
    );
  }

  async getClothingItem(id: number): Promise<ClothingItem | undefined> {
    return this.clothingItems.get(id);
  }

  async createClothingItem(insertItem: InsertClothingItem): Promise<ClothingItem> {
    const id = this.currentClothingItemId++;
    const item: ClothingItem = { 
      id, 
      userId: insertItem.userId,
      name: insertItem.name,
      category: insertItem.category,
      imageUrl: insertItem.imageUrl || null,
      colors: insertItem.colors || null,
      seasons: insertItem.seasons || null,
      occasions: insertItem.occasions || null,
      lastWorn: insertItem.lastWorn || null,
      wearCount: insertItem.wearCount || 0,
      createdAt: new Date()
    };
    this.clothingItems.set(id, item);
    return item;
  }

  async updateClothingItem(id: number, updates: Partial<ClothingItem>): Promise<ClothingItem | undefined> {
    const item = this.clothingItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.clothingItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteClothingItem(id: number): Promise<boolean> {
    return this.clothingItems.delete(id);
  }

  async getOutfits(userId: number): Promise<Outfit[]> {
    return Array.from(this.outfits.values()).filter(
      (outfit) => outfit.userId === userId
    );
  }

  async getOutfit(id: number): Promise<Outfit | undefined> {
    return this.outfits.get(id);
  }

  async createOutfit(insertOutfit: InsertOutfit): Promise<Outfit> {
    const id = this.currentOutfitId++;
    const outfit: Outfit = { 
      id, 
      userId: insertOutfit.userId,
      name: insertOutfit.name,
      itemIds: insertOutfit.itemIds || null,
      occasion: insertOutfit.occasion || null,
      weather: insertOutfit.weather || null,
      createdAt: new Date()
    };
    this.outfits.set(id, outfit);
    return outfit;
  }

  async deleteOutfit(id: number): Promise<boolean> {
    return this.outfits.delete(id);
  }

  async getOutfitHistory(userId: number): Promise<OutfitHistory[]> {
    return Array.from(this.outfitHistory.values()).filter(
      (history) => history.userId === userId
    );
  }

  async createOutfitHistory(insertHistory: InsertOutfitHistory): Promise<OutfitHistory> {
    const id = this.currentHistoryId++;
    const history: OutfitHistory = { 
      id, 
      userId: insertHistory.userId,
      outfitId: insertHistory.outfitId || null,
      itemIds: insertHistory.itemIds || null,
      occasion: insertHistory.occasion || null,
      weather: insertHistory.weather || null,
      wornDate: new Date()
    };
    this.outfitHistory.set(id, history);
    return history;
  }

  async getRecentOutfitHistory(userId: number, days: number): Promise<OutfitHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.outfitHistory.values()).filter(
      (history) => history.userId === userId && 
                   history.wornDate && 
                   history.wornDate >= cutoffDate
    );
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getClothingItems(userId: number): Promise<ClothingItem[]> {
    return await db.select().from(clothingItems).where(eq(clothingItems.userId, userId));
  }

  async getClothingItem(id: number): Promise<ClothingItem | undefined> {
    const [item] = await db.select().from(clothingItems).where(eq(clothingItems.id, id));
    return item || undefined;
  }

  async createClothingItem(insertItem: InsertClothingItem): Promise<ClothingItem> {
    const [item] = await db
      .insert(clothingItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateClothingItem(id: number, updates: Partial<ClothingItem>): Promise<ClothingItem | undefined> {
    const [item] = await db
      .update(clothingItems)
      .set(updates)
      .where(eq(clothingItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteClothingItem(id: number): Promise<boolean> {
    const result = await db.delete(clothingItems).where(eq(clothingItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getOutfits(userId: number): Promise<Outfit[]> {
    return await db.select().from(outfits).where(eq(outfits.userId, userId));
  }

  async getOutfit(id: number): Promise<Outfit | undefined> {
    const [outfit] = await db.select().from(outfits).where(eq(outfits.id, id));
    return outfit || undefined;
  }

  async createOutfit(insertOutfit: InsertOutfit): Promise<Outfit> {
    const [outfit] = await db
      .insert(outfits)
      .values(insertOutfit)
      .returning();
    return outfit;
  }

  async deleteOutfit(id: number): Promise<boolean> {
    const result = await db.delete(outfits).where(eq(outfits.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getOutfitHistory(userId: number): Promise<OutfitHistory[]> {
    return await db.select().from(outfitHistory).where(eq(outfitHistory.userId, userId));
  }

  async createOutfitHistory(insertHistory: InsertOutfitHistory): Promise<OutfitHistory> {
    const [history] = await db
      .insert(outfitHistory)
      .values(insertHistory)
      .returning();
    return history;
  }

  async getRecentOutfitHistory(userId: number, days: number): Promise<OutfitHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db
      .select()
      .from(outfitHistory)
      .where(eq(outfitHistory.userId, userId))
      .where(gte(outfitHistory.wornDate, cutoffDate));
  }
}

export const storage = new DatabaseStorage();
