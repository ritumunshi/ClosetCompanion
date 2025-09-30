import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClothingItemSchema, insertOutfitSchema, insertOutfitHistorySchema, insertNotificationSubscriptionSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import webpush from "web-push";

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
    } catch (error) {
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
        const matchesOccasion = !item.occasions || item.occasions.includes(occasion);
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
      
      // Select one item from each required category
      const suggestion = {
        top: itemsByCategory.tops[Math.floor(Math.random() * itemsByCategory.tops.length)],
        bottom: itemsByCategory.bottoms[Math.floor(Math.random() * itemsByCategory.bottoms.length)],
        shoes: itemsByCategory.shoes[Math.floor(Math.random() * itemsByCategory.shoes.length)],
        accessory: itemsByCategory.accessories.length > 0 ? 
          itemsByCategory.accessories[Math.floor(Math.random() * itemsByCategory.accessories.length)] : null
      };
      
      // Calculate confidence score
      const availableItems = Object.values(suggestion).filter(Boolean).length;
      const confidenceScore = Math.min(90, availableItems * 25 + Math.random() * 20);
      
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

  // Serve uploaded images
  app.use("/uploads", express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
