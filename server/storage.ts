import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { users, subscriptions, type User, type InsertUser, type Subscription, type InsertSubscription, type UpdateSubscriptionRequest } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPlan(id: string, plan: string): Promise<User>;
  
  getSubscriptions(userId: string): Promise<Subscription[]>;
  getSubscription(id: string, userId: string): Promise<Subscription | undefined>;
  createSubscription(userId: string, sub: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, userId: string, updates: UpdateSubscriptionRequest): Promise<Subscription | undefined>;
  deleteSubscription(id: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPlan(id: string, plan: string): Promise<User> {
    const [user] = await db.update(users).set({ plan }).where(eq(users.id, id)).returning();
    return user;
  }

  async getSubscriptions(userId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }

  async getSubscription(id: string, userId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
    return sub;
  }

  async createSubscription(userId: string, sub: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values({ ...sub, userId }).returning();
    return subscription;
  }

  async updateSubscription(id: string, userId: string, updates: UpdateSubscriptionRequest): Promise<Subscription | undefined> {
    const [sub] = await db.update(subscriptions)
      .set(updates)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .returning();
    return sub;
  }

  async deleteSubscription(id: string, userId: string): Promise<void> {
    await db.delete(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
