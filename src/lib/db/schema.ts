import { pgTable, text, timestamp, uuid, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - extends Supabase auth.users
// This is a local reference table - in production you'd typically use Supabase's auth.users directly
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Profiles table - extends Supabase auth.users
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  email_idx: index("profiles_email_idx").on(table.email),
}));

// User subscription plans
export const userPlans = pgTable("user_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  plan: text("plan").notNull().default("free"), // 'free' | 'pro'
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  stripe_price_id: text("stripe_price_id"),
  stripe_current_period_end: timestamp("stripe_current_period_end"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  user_id_idx: index("user_plans_user_id_idx").on(table.user_id),
}));

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // price in cents
  billing_cycle: text("billing_cycle").notNull(), // 'monthly' | 'yearly'
  category: text("category").notNull(),
  renewal_date: timestamp("renewal_date").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  user_id_idx: index("subscriptions_user_id_idx").on(table.user_id),
  renewal_date_idx: index("subscriptions_renewal_date_idx").on(table.renewal_date),
  category_idx: index("subscriptions_category_idx").on(table.category),
}));

// Zod Schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateProfileSchema = createUpdateSchema(profiles).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertUserPlanSchema = createInsertSchema(userPlans).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateUserPlanSchema = createUpdateSchema(userPlans).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  user_id: true,
  is_active: true,
  created_at: true,
  updated_at: true,
});

export const updateSubscriptionSchema = createUpdateSchema(subscriptions).omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

// Subscription form schema with validation
export const subscriptionFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Price must be positive"),
  billing_cycle: z.enum(["monthly", "yearly"]),
  category: z.string().min(1, "Category is required"),
  renewal_date: z.date({ required_error: "Renewal date is required" }),
});

// Auth form schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type exports
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export type UserPlan = typeof userPlans.$inferSelect;
export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;
export type UpdateUserPlan = z.infer<typeof updateUserPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;
export type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Category enum
export const CATEGORIES = [
  "Software",
  "Entertainment",
  "Utilities",
  "Cloud Services",
  "Gaming",
  "Music",
  "News",
  "Health & Fitness",
  "Education",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
