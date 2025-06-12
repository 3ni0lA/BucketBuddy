import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  date
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with local authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Bucket list items table
export const bucketListItems = pgTable("bucket_list_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("Not Started"),
  targetDate: date("target_date"),
  completionDate: date("completion_date"),
  category: text("category"),
  priority: text("priority").default("Medium"), // Low, Medium, High
  tags: text("tags").array(), // Store tags as an array of strings for now
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBucketListItemSchema = createInsertSchema(bucketListItems)
  .omit({ id: true, userId: true, createdAt: true, updatedAt: true });

export type InsertBucketListItem = z.infer<typeof insertBucketListItemSchema>;
export type BucketListItem = typeof bucketListItems.$inferSelect;

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  bucketListItems: many(bucketListItems),
  activities: many(userActivities),
}));

export const bucketListItemsRelations = relations(bucketListItems, ({ one }) => ({
  user: one(users, {
    fields: [bucketListItems.userId],
    references: [users.id],
  }),
}));

// User activity tracking table
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // login, logout, create_item, update_item, delete_item, view_dashboard
  resourceType: text("resource_type"), // bucket_item, user_profile, dashboard
  resourceId: text("resource_id"), // ID of the resource being acted upon
  metadata: jsonb("metadata"), // Additional context like IP, user agent, etc.
  timestamp: timestamp("timestamp").defaultNow(),
  sessionId: varchar("session_id"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
});

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
}));

// Daily usage summary table for efficient analytics
export const dailyUsageStats = pgTable("daily_usage_stats", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  totalActions: serial("total_actions").notNull().default(0),
  loginCount: serial("login_count").notNull().default(0),
  itemsCreated: serial("items_created").notNull().default(0),
  itemsCompleted: serial("items_completed").notNull().default(0),
  timeSpentMinutes: serial("time_spent_minutes").notNull().default(0),
});

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;
export type DailyUsageStats = typeof dailyUsageStats.$inferSelect;
