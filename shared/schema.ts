import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClothingItem = z.infer<typeof insertClothingItemSchema>;
export type ClothingItem = typeof clothingItems.$inferSelect;

export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type Outfit = typeof outfits.$inferSelect;

export type InsertOutfitHistory = z.infer<typeof insertOutfitHistorySchema>;
export type OutfitHistory = typeof outfitHistory.$inferSelect;
