import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClothingItemSchema, 
  insertOutfitSchema, 
  insertOutfitHistorySchema, 
  insertNotificationSubscriptionSchema,
  insertAvatarSchema,
  insertOutfitCompositionSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import webpush from "web-push";
import bcrypt from "bcryptjs";

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get VAPID keys from environment
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

// Function to configure web-push (called lazily when needed)
function ensureWebPushConfigured() {
  if (vapidPublicKey && vapidPrivateKey) {
    try {
      webpush.setVapidDetails(
        'mailto:admin@closetconcierge.app',
        vapidPublicKey,
        vapidPrivateKey
      );
    } catch (error) {
      console.error('Failed to configure web-push:', error);
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for demo (in real app, this would come from authentication)
  const DEMO_USER_ID = 1;

  // Authentication Routes
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, name, phone, email } = req.body;
      
      if (!username || !password || !name || !phone) {
        return res.status(400).json({ error: "Username, password, name, and phone are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Check if phone already exists
      const existingPhone = await storage.getUserByPhone(phone);
      if (existingPhone) {
        return res.status(409).json({ error: "Phone number already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const userData = {
        username,
        password: hashedPassword,
        name,
        phone,
        email: email || null
      };

      const validatedData = insertUserSchema.parse(userData);
      const user = await storage.createUser(validatedData);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "User created successfully", 
        user: userWithoutPassword 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else if (error.message?.includes('unique')) {
        res.status(409).json({ error: "Username or phone already exists" });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "Login successful", 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Clothing Items Routes
  app.get("/api/clothing-items", async (req, res) => {
    try {
      const items = await storage.getClothingItems(DEMO_USER_ID);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clothing items" });
    }
  });

  app.post("/api/clothing-items", upload.single('image'), async (req, res) => {
    try {
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);
      
      if (!req.body.data) {
        return res.status(400).json({ error: "Missing data field" });
      }
      
      const body = JSON.parse(req.body.data);
      console.log('Parsed body:', body);
      
      const itemData = {
        name: body.name,
        category: body.category,
        userId: DEMO_USER_ID,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        colors: body.colors || null,
        seasons: body.seasons || null,
        occasions: body.occasions || null,
        wearCount: 0,
        lastWorn: null
      };
      
      console.log('Item data to validate:', itemData);
      const validatedData = insertClothingItemSchema.parse(itemData);
      
      const item = await storage.createClothingItem(validatedData);
      res.json(item);
    } catch (error: any) {
      console.error('Error creating clothing item:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create clothing item", message: error.message });
      }
    }
  });

  app.patch("/api/clothing-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const item = await storage.updateClothingItem(id, updates);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update clothing item" });
    }
  });

  app.delete("/api/clothing-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteClothingItem(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete clothing item" });
    }
  });

  // Outfits Routes
  app.get("/api/outfits", async (req, res) => {
    try {
      const outfits = await storage.getOutfits(DEMO_USER_ID);
      res.json(outfits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outfits" });
    }
  });

  app.post("/api/outfits", async (req, res) => {
    try {
      const validatedData = insertOutfitSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
      });
      
      const outfit = await storage.createOutfit(validatedData);
      res.json(outfit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create outfit" });
      }
    }
  });

  app.delete("/api/outfits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOutfit(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Outfit not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete outfit" });
    }
  });

  // Outfit History Routes
  app.get("/api/outfit-history", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const history = await storage.getRecentOutfitHistory(DEMO_USER_ID, days);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outfit history" });
    }
  });

  app.post("/api/outfit-history", async (req, res) => {
    try {
      const validatedData = insertOutfitHistorySchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
      });
      
      const history = await storage.createOutfitHistory(validatedData);
      
      // Update wear count for items
      if (validatedData.itemIds) {
        for (const itemId of validatedData.itemIds) {
          const item = await storage.getClothingItem(itemId);
          if (item) {
            await storage.updateClothingItem(itemId, {
              wearCount: (item.wearCount || 0) + 1,
              lastWorn: new Date()
            });
          }
        }
      }
      
      res.json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create outfit history" });
      }
    }
  });

  // Outfit Suggestion Route
  app.post("/api/suggest-outfit", async (req, res) => {
    try {
      const { occasion, weather } = req.body;
      
      if (!occasion || !weather) {
        return res.status(400).json({ error: "Occasion and weather are required" });
      }
      
      const items = await storage.getClothingItems(DEMO_USER_ID);
      const recentHistory = await storage.getRecentOutfitHistory(DEMO_USER_ID, 7);
      
      // Simple AI logic for outfit suggestion
      const recentlyWornItems = new Set(
        recentHistory.flatMap(h => h.itemIds || [])
      );
      
      // Filter items based on occasion and weather
      const filteredItems = items.filter(item => {
        const matchesOccasion = !item.occasions || item.occasions.length === 0 || item.occasions.includes(occasion);
        const matchesWeather = !item.seasons || item.seasons.length === 0 || item.seasons.some(season => {
          if (weather === 'cold') return season === 'winter' || season === 'fall';
          if (weather === 'warm') return season === 'summer' || season === 'spring';
          if (weather === 'rainy') return season === 'fall' || season === 'winter';
          return true;
        });
        const notRecentlyWorn = !recentlyWornItems.has(item.id);
        
        return matchesOccasion && matchesWeather && notRecentlyWorn;
      });
      
      // Group by category
      const itemsByCategory = {
        tops: filteredItems.filter(item => item.category === 'tops'),
        bottoms: filteredItems.filter(item => item.category === 'bottoms'),
        shoes: filteredItems.filter(item => item.category === 'shoes'),
        accessories: filteredItems.filter(item => item.category === 'accessories')
      };
      
      // Check if we have enough items to create an outfit
      if (items.length === 0) {
        return res.json({
          suggestion: null,
          confidenceScore: 0,
          occasion,
          weather,
          message: "No items in your wardrobe yet. Add some clothing items first!"
        });
      }
      
      // Count available items per category
      const availableCategories = [
        itemsByCategory.tops.length > 0,
        itemsByCategory.bottoms.length > 0,
        itemsByCategory.shoes.length > 0
      ].filter(Boolean).length;
      
      // If no items matched the criteria, return low confidence
      if (availableCategories === 0) {
        return res.json({
          suggestion: null,
          confidenceScore: 0,
          occasion,
          weather,
          message: "No matching items found for these conditions. Try different options or add more items!"
        });
      }
      
      // Need at least 2 core categories (top, bottom, shoes) for a basic outfit
      if (availableCategories < 2) {
        return res.json({
          suggestion: null,
          confidenceScore: 25,
          occasion,
          weather,
          message: "Limited matches. Add more items for better suggestions!"
        });
      }
      
      // Select one item from each available required category
      const suggestion = {
        top: itemsByCategory.tops.length > 0 ? 
          itemsByCategory.tops[Math.floor(Math.random() * itemsByCategory.tops.length)] : undefined,
        bottom: itemsByCategory.bottoms.length > 0 ? 
          itemsByCategory.bottoms[Math.floor(Math.random() * itemsByCategory.bottoms.length)] : undefined,
        shoes: itemsByCategory.shoes.length > 0 ? 
          itemsByCategory.shoes[Math.floor(Math.random() * itemsByCategory.shoes.length)] : undefined,
        accessory: itemsByCategory.accessories.length > 0 ? 
          itemsByCategory.accessories[Math.floor(Math.random() * itemsByCategory.accessories.length)] : null
      };
      
      // Calculate final available items count
      const availableItems = Object.values(suggestion).filter(Boolean).length;
      
      const confidenceScore = Math.min(95, availableItems * 25 + Math.random() * 20);
      
      res.json({
        suggestion,
        confidenceScore: Math.round(confidenceScore),
        occasion,
        weather
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate outfit suggestion" });
    }
  });

  // Avatar Routes
  app.get("/api/avatars", async (req, res) => {
    try {
      const avatars = await storage.getAvatars(DEMO_USER_ID);
      res.json(avatars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch avatars" });
    }
  });

  app.post("/api/avatars", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const avatarData = {
        userId: DEMO_USER_ID,
        imageUrl: `/uploads/${req.file.filename}`,
        name: req.body.name || 'My Avatar',
        isDefault: req.body.isDefault === 'true' || false
      };

      const validatedData = insertAvatarSchema.parse(avatarData);
      
      // If this is set as default, unset other defaults
      if (validatedData.isDefault) {
        const existingAvatars = await storage.getAvatars(DEMO_USER_ID);
        for (const avatar of existingAvatars) {
          if (avatar.isDefault) {
            await storage.updateAvatar(avatar.id, { isDefault: false });
          }
        }
      }

      const avatar = await storage.createAvatar(validatedData);
      res.json(avatar);
    } catch (error) {
      console.error('Error creating avatar:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create avatar" });
      }
    }
  });

  app.patch("/api/avatars/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // If setting as default, unset other defaults
      if (updates.isDefault) {
        const existingAvatars = await storage.getAvatars(DEMO_USER_ID);
        for (const avatar of existingAvatars) {
          if (avatar.isDefault && avatar.id !== id) {
            await storage.updateAvatar(avatar.id, { isDefault: false });
          }
        }
      }

      const avatar = await storage.updateAvatar(id, updates);
      if (!avatar) {
        return res.status(404).json({ error: "Avatar not found" });
      }
      
      res.json(avatar);
    } catch (error) {
      res.status(500).json({ error: "Failed to update avatar" });
    }
  });

  app.delete("/api/avatars/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const avatar = await storage.getAvatar(id);
      
      if (!avatar) {
        return res.status(404).json({ error: "Avatar not found" });
      }

      // Delete the file from disk
      if (avatar.imageUrl) {
        // Remove leading slash from imageUrl for correct path resolution
        const relativePath = avatar.imageUrl.startsWith('/') ? avatar.imageUrl.slice(1) : avatar.imageUrl;
        const filePath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      const deleted = await storage.deleteAvatar(id);
      res.json({ success: deleted });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      res.status(500).json({ error: "Failed to delete avatar" });
    }
  });

  // Outfit Composition Routes
  app.get("/api/outfit-compositions", async (req, res) => {
    try {
      const compositions = await storage.getOutfitCompositions(DEMO_USER_ID);
      res.json(compositions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outfit compositions" });
    }
  });

  app.post("/api/outfit-compositions", async (req, res) => {
    try {
      const validatedData = insertOutfitCompositionSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
      });
      
      const composition = await storage.createOutfitComposition(validatedData);
      res.json(composition);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create outfit composition" });
      }
    }
  });

  app.patch("/api/outfit-compositions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const composition = await storage.updateOutfitComposition(id, updates);
      if (!composition) {
        return res.status(404).json({ error: "Composition not found" });
      }
      
      res.json(composition);
    } catch (error) {
      res.status(500).json({ error: "Failed to update outfit composition" });
    }
  });

  app.delete("/api/outfit-compositions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOutfitComposition(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Composition not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete outfit composition" });
    }
  });

  // Notification Subscription Routes
  app.get("/api/notification-subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getNotificationSubscriptions(DEMO_USER_ID);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification subscriptions" });
    }
  });

  app.post("/api/notification-subscriptions", async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }
      
      const validatedData = insertNotificationSubscriptionSchema.parse({
        userId: DEMO_USER_ID,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      });
      
      const subscription = await storage.createNotificationSubscription(validatedData);
      res.json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to save notification subscription" });
      }
    }
  });

  app.delete("/api/notification-subscriptions/:endpoint", async (req, res) => {
    try {
      const endpoint = decodeURIComponent(req.params.endpoint);
      const deleted = await storage.deleteNotificationSubscriptionByEndpoint(DEMO_USER_ID, endpoint);
      
      if (!deleted) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification subscription" });
    }
  });

  // Send notification endpoint
  app.post("/api/send-notification", async (req, res) => {
    try {
      if (!vapidPublicKey || !vapidPrivateKey) {
        return res.status(503).json({ error: "Push notifications not configured. VAPID keys missing." });
      }
      
      ensureWebPushConfigured();
      
      const { title, body, icon, data } = req.body;
      
      const subscriptions = await storage.getNotificationSubscriptions(DEMO_USER_ID);
      
      if (subscriptions.length === 0) {
        return res.status(404).json({ error: "No active subscriptions found" });
      }
      
      const payload = JSON.stringify({
        title: title || 'Closet Concierge',
        body: body || 'You have a new notification',
        icon: icon || '/icon-192x192.png',
        data: data || {}
      });
      
      const results = await Promise.allSettled(
        subscriptions.map((sub, index) =>
          webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload).then(() => ({ index, status: 'success' as const }))
          .catch((error: any) => ({ index, status: 'error' as const, error, subId: sub.id }))
        )
      );
      
      // Remove subscriptions that permanently failed (410 Gone, 404 Not Found)
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.status === 'error') {
          const error = result.value.error;
          if (error.statusCode === 410 || error.statusCode === 404) {
            const subId = result.value.subId;
            await storage.deleteNotificationSubscription(subId);
            console.log(`Removed invalid subscription ${subId}`);
          }
        }
      }
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
      const failCount = results.length - successCount;
      
      res.json({ 
        success: true, 
        sent: successCount,
        failed: failCount
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Get VAPID public key endpoint
  app.get("/api/vapid-public-key", (req, res) => {
    if (!vapidPublicKey) {
      return res.status(503).json({ error: "Push notifications not configured. VAPID key missing." });
    }
    res.json({ publicKey: vapidPublicKey });
  });

  // Daily outfit suggestion notification endpoint
  app.post("/api/daily-outfit-notification", async (req, res) => {
    try {
      if (!vapidPublicKey || !vapidPrivateKey) {
        return res.status(503).json({ error: "Push notifications not configured. VAPID keys missing." });
      }

      ensureWebPushConfigured();

      const { weather, occasion } = req.body;

      // Get clothing items for the user
      const items = await storage.getClothingItems(DEMO_USER_ID);
      const recentHistory = await storage.getRecentOutfitHistory(DEMO_USER_ID, 7);

      if (items.length === 0) {
        return res.status(404).json({ error: "No clothing items found" });
      }

      // Simple AI logic for outfit suggestion
      const recentlyWornItems = new Set(
        recentHistory.flatMap(h => h.itemIds || [])
      );

      // Filter items based on occasion and weather
      const filteredItems = items.filter(item => {
        const matchesOccasion = !occasion || !item.occasions || item.occasions.includes(occasion);
        const matchesWeather = !item.seasons || item.seasons.some(season => {
          if (weather === 'cold') return season === 'winter' || season === 'fall';
          if (weather === 'warm') return season === 'summer' || season === 'spring';
          if (weather === 'rainy') return season === 'fall' || season === 'winter';
          return true;
        });
        const notRecentlyWorn = !recentlyWornItems.has(item.id);

        return matchesOccasion && matchesWeather && notRecentlyWorn;
      });

      // Group by category
      const itemsByCategory = {
        tops: filteredItems.filter(item => item.category === 'tops'),
        bottoms: filteredItems.filter(item => item.category === 'bottoms'),
        shoes: filteredItems.filter(item => item.category === 'shoes'),
        accessories: filteredItems.filter(item => item.category === 'accessories')
      };

      // Select one item from each category
      const top = itemsByCategory.tops[Math.floor(Math.random() * itemsByCategory.tops.length)];
      const bottom = itemsByCategory.bottoms[Math.floor(Math.random() * itemsByCategory.bottoms.length)];
      const shoes = itemsByCategory.shoes[Math.floor(Math.random() * itemsByCategory.shoes.length)];

      if (!top || !bottom || !shoes) {
        return res.status(404).json({ error: "Not enough items to create a complete outfit" });
      }

      // Create notification message
      const outfitDescription = `${top.name}, ${bottom.name}, and ${shoes.name}`;
      const weatherEmoji = weather === 'cold' ? '❄️' : weather === 'warm' ? '☀️' : weather === 'rainy' ? '🌧️' : '☁️';

      const notificationPayload = {
        title: `${weatherEmoji} Your Daily Outfit`,
        body: `Today's suggestion: ${outfitDescription}`,
        data: {
          url: '/',
          outfitItems: [top.id, bottom.id, shoes.id]
        }
      };

      // Send notification to all subscriptions
      const subscriptions = await storage.getNotificationSubscriptions(DEMO_USER_ID);

      if (subscriptions.length === 0) {
        return res.status(404).json({ error: "No active subscriptions found" });
      }

      const payload = JSON.stringify(notificationPayload);

      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload).then(() => ({ status: 'success' as const }))
          .catch((error: any) => ({ status: 'error' as const, error, subId: sub.id }))
        )
      );

      // Remove subscriptions that permanently failed
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.status === 'error') {
          const error = result.value.error;
          if (error.statusCode === 410 || error.statusCode === 404) {
            const subId = result.value.subId;
            await storage.deleteNotificationSubscription(subId);
            console.log(`Removed invalid subscription ${subId}`);
          }
        }
      }

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
      const failCount = results.length - successCount;

      res.json({
        success: true,
        sent: successCount,
        failed: failCount,
        outfit: {
          top: top.name,
          bottom: bottom.name,
          shoes: shoes.name
        }
      });
    } catch (error) {
      console.error('Error sending daily outfit notification:', error);
      res.status(500).json({ error: "Failed to send daily outfit notification" });
    }
  });

  // Serve uploaded images
  app.use("/uploads", express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
