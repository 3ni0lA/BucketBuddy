import {
  users,
  bucketListItems,
  type User,
  type UpsertUser,
  type BucketListItem,
  type InsertBucketListItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Bucket list operations
  getBucketListItems(userId: string, filter?: string, search?: string): Promise<BucketListItem[]>;
  getBucketListItem(id: number, userId: string): Promise<BucketListItem | undefined>;
  createBucketListItem(userId: string, item: InsertBucketListItem): Promise<BucketListItem>;
  updateBucketListItem(id: number, userId: string, item: Partial<InsertBucketListItem>): Promise<BucketListItem | undefined>;
  deleteBucketListItem(id: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Bucket list operations
  async getBucketListItems(userId: string, filter?: string, search?: string): Promise<BucketListItem[]> {
    let query = db.select().from(bucketListItems).where(eq(bucketListItems.userId, userId));
    
    // Apply filters
    if (filter && filter !== 'All Items') {
      query = query.where(eq(bucketListItems.status, filter));
    }
    
    // Apply search
    if (search) {
      query = query.where(
        like(bucketListItems.title, `%${search}%`)
      );
    }
    
    // Sort by most recently created
    return await query.orderBy(desc(bucketListItems.createdAt));
  }

  async getBucketListItem(id: number, userId: string): Promise<BucketListItem | undefined> {
    const [item] = await db
      .select()
      .from(bucketListItems)
      .where(and(
        eq(bucketListItems.id, id),
        eq(bucketListItems.userId, userId)
      ));
    return item;
  }

  async createBucketListItem(userId: string, item: InsertBucketListItem): Promise<BucketListItem> {
    const [createdItem] = await db
      .insert(bucketListItems)
      .values({
        ...item,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return createdItem;
  }

  async updateBucketListItem(id: number, userId: string, item: Partial<InsertBucketListItem>): Promise<BucketListItem | undefined> {
    const [updatedItem] = await db
      .update(bucketListItems)
      .set({
        ...item,
        updatedAt: new Date(),
        ...(item.status === 'Completed' && !item.completionDate 
          ? { completionDate: new Date() } 
          : {})
      })
      .where(and(
        eq(bucketListItems.id, id),
        eq(bucketListItems.userId, userId)
      ))
      .returning();
    return updatedItem;
  }

  async deleteBucketListItem(id: number, userId: string): Promise<boolean> {
    const [deletedItem] = await db
      .delete(bucketListItems)
      .where(and(
        eq(bucketListItems.id, id),
        eq(bucketListItems.userId, userId)
      ))
      .returning();
    return !!deletedItem;
  }
}

export const storage = new DatabaseStorage();
