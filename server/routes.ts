import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./Auth";
import { insertBucketListItemSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { ActivityTracker } from "./analytics";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // For local authentication, req.user is already the full user object
      // Strip the password hash before sending to client
      const { passwordHash, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Bucket list routes
  app.get('/api/bucket-list', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id; // For local auth, use user.id directly
      const filter = req.query.filter as string | undefined;
      const search = req.query.search as string | undefined;
      
      const items = await storage.getBucketListItems(userId, filter, search);
      res.json(items);
    } catch (error) {
      console.error("Error fetching bucket list items:", error);
      res.status(500).json({ message: "Failed to fetch bucket list items" });
    }
  });

  app.get('/api/bucket-list/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id; // For local auth, use user.id directly
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const item = await storage.getBucketListItem(id, userId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching bucket list item:", error);
      res.status(500).json({ message: "Failed to fetch bucket list item" });
    }
  });

  app.post('/api/bucket-list', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id; // For local auth, use user.id directly
      
      // Validate request body
      const validatedData = insertBucketListItemSchema.parse(req.body);
      
      const newItem = await storage.createBucketListItem(userId, validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating bucket list item:", error);
      res.status(500).json({ message: "Failed to create bucket list item" });
    }
  });

  app.patch('/api/bucket-list/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id; // For local auth, use user.id directly
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Validate request body against partial schema
      const validatedData = insertBucketListItemSchema.partial().parse(req.body);
      
      const updatedItem = await storage.updateBucketListItem(id, userId, validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating bucket list item:", error);
      res.status(500).json({ message: "Failed to update bucket list item" });
    }
  });

  app.delete('/api/bucket-list/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id; // For local auth, use user.id directly
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteBucketListItem(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting bucket list item:", error);
      res.status(500).json({ message: "Failed to delete bucket list item" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days as string) || 30;
      
      const analytics = await ActivityTracker.getUserAnalytics(userId, days);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/analytics/system', isAuthenticated, async (req: any, res) => {
    try {
      // You might want to add admin check here
      const days = parseInt(req.query.days as string) || 30;
      
      const analytics = await ActivityTracker.getSystemAnalytics(days);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching system analytics:", error);
      res.status(500).json({ message: "Failed to fetch system analytics" });
    }
  });

  // Manual activity logging endpoint (for client-side events)
  app.post('/api/analytics/track', isAuthenticated, async (req: any, res) => {
    try {
      const { action, resourceType, resourceId, metadata } = req.body;
      
      await ActivityTracker.logActivity({
        userId: req.user.id,
        action,
        resourceType,
        resourceId,
        sessionId: req.sessionID,
        req,
        metadata,
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Error logging manual activity:", error);
      res.status(500).json({ message: "Failed to log activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
