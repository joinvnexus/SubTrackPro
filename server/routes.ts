import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import passport from "passport";

function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      req.login(user, (err) => {
        if (err) throw err;
        const { password, ...userResponse } = user;
        res.status(201).json(userResponse);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    const { password, ...userResponse } = req.user as any;
    res.status(200).json(userResponse);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password, ...userResponse } = req.user as any;
    res.status(200).json(userResponse);
  });

  // Subscriptions
  app.get(api.subscriptions.list.path, ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const subs = await storage.getSubscriptions(user.id);
    res.status(200).json(subs);
  });

  app.post(api.subscriptions.create.path, ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const subs = await storage.getSubscriptions(user.id);
      
      if (user.plan === 'free' && subs.length >= 5) {
        return res.status(403).json({ message: "Free plan limit reached (5 subscriptions max). Please upgrade to Pro." });
      }

      // Convert input string to proper types
      const bodySchema = api.subscriptions.create.input.extend({
        price: z.coerce.number(),
        renewalDate: z.coerce.date()
      });
      const input = bodySchema.parse(req.body);
      const sub = await storage.createSubscription(user.id, input);
      res.status(201).json(sub);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.subscriptions.update.path, ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const bodySchema = api.subscriptions.update.input.extend({
        price: z.coerce.number().optional(),
        renewalDate: z.coerce.date().optional()
      });
      
      const input = bodySchema.parse(req.body);
      const sub = await storage.updateSubscription(req.params.id, user.id, input);
      if (!sub) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.status(200).json(sub);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.subscriptions.delete.path, ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const sub = await storage.getSubscription(req.params.id, user.id);
    if (!sub) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    await storage.deleteSubscription(req.params.id, user.id);
    res.status(204).send();
  });

  // Billing (Mock Stripe for free tier users)
  app.post(api.billing.upgrade.path, ensureAuthenticated, async (req, res) => {
    const user = req.user as any;
    const updatedUser = await storage.updateUserPlan(user.id, 'pro');
    const { password, ...userResponse } = updatedUser;
    res.status(200).json(userResponse);
  });

  return httpServer;
}
