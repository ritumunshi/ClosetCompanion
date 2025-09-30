import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clothingItems = pgTable("clothing_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // tops, bottoms, shoes, accessories
  imageUrl: text("image_url"),
  colors: text("colors").array(), // array of color strings
  seasons: text("seasons").array(), // spring, summer, fall, winter
  occasions: text("occasions").array(), // casual, work, party, gym
  lastWorn: timestamp("last_worn"),
  wearCount: integer("wear_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const outfits = pgTable("outfits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  itemIds: integer("item_ids").array(), // array of clothing item IDs
  occasion: text("occasion"),
  weather: text("weather"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const outfitHistory = pgTable("outfit_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  outfitId: integer("outfit_id"),
  itemIds: integer("item_ids").array(), // array of clothing item IDs
  wornDate: timestamp("worn_date").defaultNow(),
  occasion: text("occasion"),
  weather: text("weather"),
});

export const notificationSubscriptions = pgTable("notification_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const avatars = pgTable("avatars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  name: text("name"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const outfitCompositions = pgTable("outfit_compositions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  avatarId: integer("avatar_id"),
  name: text("name").notNull(),
  previewImageUrl: text("preview_image_url"),
  items: text("items").notNull(), // JSON string of item positions/scales/rotations
  occasion: text("occasion"),
  season: text("season"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClothingItemSchema = createInsertSchema(clothingItems).omit({
  id: true,
  createdAt: true,
});

export const insertOutfitSchema = createInsertSchema(outfits).omit({
  id: true,
  createdAt: true,
});

export const insertOutfitHistorySchema = createInsertSchema(outfitHistory).omit({
  id: true,
  wornDate: true,
});

export const insertNotificationSubscriptionSchema = createInsertSchema(notificationSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertAvatarSchema = createInsertSchema(avatars).omit({
  id: true,
  createdAt: true,
});

export const insertOutfitCompositionSchema = createInsertSchema(outfitCompositions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClothingItem = z.infer<typeof insertClothingItemSchema>;
export type ClothingItem = typeof clothingItems.$inferSelect;

export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type Outfit = typeof outfits.$inferSelect;

export type InsertOutfitHistory = z.infer<typeof insertOutfitHistorySchema>;
export type OutfitHistory = typeof outfitHistory.$inferSelect;

export type InsertNotificationSubscription = z.infer<typeof insertNotificationSubscriptionSchema>;
export type NotificationSubscription = typeof notificationSubscriptions.$inferSelect;

export type InsertAvatar = z.infer<typeof insertAvatarSchema>;
export type Avatar = typeof avatars.$inferSelect;

export type InsertOutfitComposition = z.infer<typeof insertOutfitCompositionSchema>;
export type OutfitComposition = typeof outfitCompositions.$inferSelect;
