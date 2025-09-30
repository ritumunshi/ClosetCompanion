import { 
  users, 
  clothingItems, 
  outfits, 
  outfitHistory,
  notificationSubscriptions,
  avatars,
  outfitCompositions,
  type User, 
  type InsertUser,
  type ClothingItem,
  type InsertClothingItem,
  type Outfit,
  type InsertOutfit,
  type OutfitHistory,
  type InsertOutfitHistory,
  type NotificationSubscription,
  type InsertNotificationSubscription,
  type Avatar,
  type InsertAvatar,
  type OutfitComposition,
  type InsertOutfitComposition
} from "@shared/schema";
import { db } from "./db";
import { eq, gte, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOtp(phone: string, otpCode: string, otpExpiry: Date): Promise<boolean>;
  verifyUserOtp(phone: string, otpCode: string): Promise<User | null>;
  markPhoneVerified(userId: number): Promise<boolean>;
  
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
  
  getNotificationSubscriptions(userId: number): Promise<NotificationSubscription[]>;
  createNotificationSubscription(subscription: InsertNotificationSubscription): Promise<NotificationSubscription>;
  deleteNotificationSubscription(id: number): Promise<boolean>;
  deleteNotificationSubscriptionByEndpoint(userId: number, endpoint: string): Promise<boolean>;
  
  getAvatars(userId: number): Promise<Avatar[]>;
  getAvatar(id: number): Promise<Avatar | undefined>;
  createAvatar(avatar: InsertAvatar): Promise<Avatar>;
  updateAvatar(id: number, updates: Partial<Avatar>): Promise<Avatar | undefined>;
  deleteAvatar(id: number): Promise<boolean>;
  
  getOutfitCompositions(userId: number): Promise<OutfitComposition[]>;
  getOutfitComposition(id: number): Promise<OutfitComposition | undefined>;
  createOutfitComposition(composition: InsertOutfitComposition): Promise<OutfitComposition>;
  updateOutfitComposition(id: number, updates: Partial<OutfitComposition>): Promise<OutfitComposition | undefined>;
  deleteOutfitComposition(id: number): Promise<boolean>;
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

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(), 
      phoneVerified: false, 
      otpCode: null, 
      otpExpiry: null,
      email: insertUser.email || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserOtp(phone: string, otpCode: string, otpExpiry: Date): Promise<boolean> {
    const user = await this.getUserByPhone(phone);
    if (!user) return false;
    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    this.users.set(user.id, user);
    return true;
  }

  async verifyUserOtp(phone: string, otpCode: string): Promise<User | null> {
    const user = await this.getUserByPhone(phone);
    if (!user || !user.otpCode || !user.otpExpiry) return null;
    if (user.otpCode !== otpCode) return null;
    if (new Date() > user.otpExpiry) return null;
    return user;
  }

  async markPhoneVerified(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.phoneVerified = true;
    user.otpCode = null;
    user.otpExpiry = null;
    this.users.set(userId, user);
    return true;
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
  
  async getNotificationSubscriptions(userId: number): Promise<NotificationSubscription[]> {
    return [];
  }
  
  async createNotificationSubscription(subscription: InsertNotificationSubscription): Promise<NotificationSubscription> {
    throw new Error("Not implemented for in-memory storage");
  }
  
  async deleteNotificationSubscription(id: number): Promise<boolean> {
    return false;
  }
  
  async deleteNotificationSubscriptionByEndpoint(userId: number, endpoint: string): Promise<boolean> {
    return false;
  }
  
  async getAvatars(userId: number): Promise<Avatar[]> {
    return [];
  }
  
  async getAvatar(id: number): Promise<Avatar | undefined> {
    return undefined;
  }
  
  async createAvatar(avatar: InsertAvatar): Promise<Avatar> {
    throw new Error("Not implemented for in-memory storage");
  }
  
  async updateAvatar(id: number, updates: Partial<Avatar>): Promise<Avatar | undefined> {
    return undefined;
  }
  
  async deleteAvatar(id: number): Promise<boolean> {
    return false;
  }
  
  async getOutfitCompositions(userId: number): Promise<OutfitComposition[]> {
    return [];
  }
  
  async getOutfitComposition(id: number): Promise<OutfitComposition | undefined> {
    return undefined;
  }
  
  async createOutfitComposition(composition: InsertOutfitComposition): Promise<OutfitComposition> {
    throw new Error("Not implemented for in-memory storage");
  }
  
  async updateOutfitComposition(id: number, updates: Partial<OutfitComposition>): Promise<OutfitComposition | undefined> {
    return undefined;
  }
  
  async deleteOutfitComposition(id: number): Promise<boolean> {
    return false;
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

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserOtp(phone: string, otpCode: string, otpExpiry: Date): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ otpCode, otpExpiry })
      .where(eq(users.phone, phone));
    return (result.rowCount || 0) > 0;
  }

  async verifyUserOtp(phone: string, otpCode: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.phone, phone),
        eq(users.otpCode, otpCode)
      ));
    
    if (!user || !user.otpExpiry) return null;
    if (new Date() > user.otpExpiry) return null;
    
    return user;
  }

  async markPhoneVerified(userId: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ phoneVerified: true, otpCode: null, otpExpiry: null })
      .where(eq(users.id, userId));
    return (result.rowCount || 0) > 0;
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
      .where(and(
        eq(outfitHistory.userId, userId),
        gte(outfitHistory.wornDate, cutoffDate)
      ));
  }
  
  async getNotificationSubscriptions(userId: number): Promise<NotificationSubscription[]> {
    return await db.select().from(notificationSubscriptions).where(eq(notificationSubscriptions.userId, userId));
  }
  
  async createNotificationSubscription(subscription: InsertNotificationSubscription): Promise<NotificationSubscription> {
    const [sub] = await db
      .insert(notificationSubscriptions)
      .values(subscription)
      .returning();
    return sub;
  }
  
  async deleteNotificationSubscription(id: number): Promise<boolean> {
    const result = await db.delete(notificationSubscriptions).where(eq(notificationSubscriptions.id, id));
    return (result.rowCount || 0) > 0;
  }
  
  async deleteNotificationSubscriptionByEndpoint(userId: number, endpoint: string): Promise<boolean> {
    const result = await db.delete(notificationSubscriptions).where(and(
      eq(notificationSubscriptions.userId, userId),
      eq(notificationSubscriptions.endpoint, endpoint)
    ));
    return (result.rowCount || 0) > 0;
  }
  
  async getAvatars(userId: number): Promise<Avatar[]> {
    return await db.select().from(avatars).where(eq(avatars.userId, userId));
  }
  
  async getAvatar(id: number): Promise<Avatar | undefined> {
    const [avatar] = await db.select().from(avatars).where(eq(avatars.id, id));
    return avatar || undefined;
  }
  
  async createAvatar(insertAvatar: InsertAvatar): Promise<Avatar> {
    const [avatar] = await db
      .insert(avatars)
      .values(insertAvatar)
      .returning();
    return avatar;
  }
  
  async updateAvatar(id: number, updates: Partial<Avatar>): Promise<Avatar | undefined> {
    const [avatar] = await db
      .update(avatars)
      .set(updates)
      .where(eq(avatars.id, id))
      .returning();
    return avatar || undefined;
  }
  
  async deleteAvatar(id: number): Promise<boolean> {
    const result = await db.delete(avatars).where(eq(avatars.id, id));
    return (result.rowCount || 0) > 0;
  }
  
  async getOutfitCompositions(userId: number): Promise<OutfitComposition[]> {
    return await db.select().from(outfitCompositions).where(eq(outfitCompositions.userId, userId));
  }
  
  async getOutfitComposition(id: number): Promise<OutfitComposition | undefined> {
    const [composition] = await db.select().from(outfitCompositions).where(eq(outfitCompositions.id, id));
    return composition || undefined;
  }
  
  async createOutfitComposition(insertComposition: InsertOutfitComposition): Promise<OutfitComposition> {
    const [composition] = await db
      .insert(outfitCompositions)
      .values(insertComposition)
      .returning();
    return composition;
  }
  
  async updateOutfitComposition(id: number, updates: Partial<OutfitComposition>): Promise<OutfitComposition | undefined> {
    const [composition] = await db
      .update(outfitCompositions)
      .set(updates)
      .where(eq(outfitCompositions.id, id))
      .returning();
    return composition || undefined;
  }
  
  async deleteOutfitComposition(id: number): Promise<boolean> {
    const result = await db.delete(outfitCompositions).where(eq(outfitCompositions.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
