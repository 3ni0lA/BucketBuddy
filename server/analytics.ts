import { db } from "./db";
import { userActivities, dailyUsageStats, type InsertUserActivity } from "@shared/schema";
import { sql, eq, and, desc, count, sum } from "drizzle-orm";
import type { Request } from "express";

export class ActivityTracker {
  // Log user activity
  static async logActivity({
    userId,
    action,
    resourceType,
    resourceId,
    sessionId,
    req,
    metadata = {}
  }: {
    userId: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    sessionId?: string;
    req?: Request;
    metadata?: Record<string, any>;
  }) {
    try {
      const activity: InsertUserActivity = {
        userId,
        action,
        resourceType,
        resourceId,
        sessionId,
        ipAddress: req?.ip || req?.socket?.remoteAddress,
        userAgent: req?.get('User-Agent'),
        metadata,
      };

      await db.insert(userActivities).values(activity);
      
      // Also update daily stats in background (don't await)
      this.updateDailyStats(userId, action).catch(console.error);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - activity logging should not break the main flow
    }
  }

  // Update daily usage statistics
  private static async updateDailyStats(userId: string, action: string) {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const existing = await db
        .select()
        .from(dailyUsageStats)
        .where(
          and(
            eq(dailyUsageStats.userId, userId),
            eq(dailyUsageStats.date, today)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        // Create new daily stats record
        await db.insert(dailyUsageStats).values({
          date: today,
          userId,
          totalActions: 1,
          loginCount: action === 'login' ? 1 : 0,
          itemsCreated: action === 'create_item' ? 1 : 0,
          itemsCompleted: action === 'complete_item' ? 1 : 0,
        });
      } else {
        // Update existing record
        const updates: any = {
          totalActions: sql`${dailyUsageStats.totalActions} + 1`,
        };
        
        if (action === 'login') {
          updates.loginCount = sql`${dailyUsageStats.loginCount} + 1`;
        }
        if (action === 'create_item') {
          updates.itemsCreated = sql`${dailyUsageStats.itemsCreated} + 1`;
        }
        if (action === 'complete_item') {
          updates.itemsCompleted = sql`${dailyUsageStats.itemsCompleted} + 1`;
        }

        await db
          .update(dailyUsageStats)
          .set(updates)
          .where(
            and(
              eq(dailyUsageStats.userId, userId),
              eq(dailyUsageStats.date, today)
            )
          );
      }
    } catch (error) {
      console.error('Failed to update daily stats:', error);
    }
  }

  // Get user activity analytics
  static async getUserAnalytics(userId: string, days: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get recent activities
      const recentActivities = await db
        .select()
        .from(userActivities)
        .where(
          and(
            eq(userActivities.userId, userId),
            sql`${userActivities.timestamp} >= ${cutoffDate.toISOString()}`
          )
        )
        .orderBy(desc(userActivities.timestamp))
        .limit(100);

      // Get daily stats for the period
      const dailyStats = await db
        .select()
        .from(dailyUsageStats)
        .where(
          and(
            eq(dailyUsageStats.userId, userId),
            sql`${dailyUsageStats.date} >= ${cutoffDate.toISOString().split('T')[0]}`
          )
        )
        .orderBy(desc(dailyUsageStats.date));

      // Calculate summary statistics
      const summary = await db
        .select({
          totalActions: sum(dailyUsageStats.totalActions),
          totalLogins: sum(dailyUsageStats.loginCount),
          totalItemsCreated: sum(dailyUsageStats.itemsCreated),
          totalItemsCompleted: sum(dailyUsageStats.itemsCompleted),
          avgTimeSpent: sql`AVG(${dailyUsageStats.timeSpentMinutes})`,
        })
        .from(dailyUsageStats)
        .where(
          and(
            eq(dailyUsageStats.userId, userId),
            sql`${dailyUsageStats.date} >= ${cutoffDate.toISOString().split('T')[0]}`
          )
        );

      return {
        recentActivities,
        dailyStats,
        summary: summary[0] || {
          totalActions: 0,
          totalLogins: 0,
          totalItemsCreated: 0,
          totalItemsCompleted: 0,
          avgTimeSpent: 0,
        },
      };
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return { recentActivities: [], dailyStats: [], summary: {} };
    }
  }

  // Get system-wide analytics (for admin dashboard)
  static async getSystemAnalytics(days: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Total active users
      const activeUsers = await db
        .select({ count: count() })
        .from(userActivities)
        .where(sql`${userActivities.timestamp} >= ${cutoffDate.toISOString()}`);

      // Activity breakdown by action type
      const actionBreakdown = await db
        .select({
          action: userActivities.action,
          count: count(),
        })
        .from(userActivities)
        .where(sql`${userActivities.timestamp} >= ${cutoffDate.toISOString()}`)
        .groupBy(userActivities.action);

      // Daily activity trends
      const dailyTrends = await db
        .select({
          date: sql`DATE(${userActivities.timestamp})`,
          totalActions: count(),
          uniqueUsers: sql`COUNT(DISTINCT ${userActivities.userId})`,
        })
        .from(userActivities)
        .where(sql`${userActivities.timestamp} >= ${cutoffDate.toISOString()}`)
        .groupBy(sql`DATE(${userActivities.timestamp})`)
        .orderBy(sql`DATE(${userActivities.timestamp})`);

      return {
        activeUsers: activeUsers[0]?.count || 0,
        actionBreakdown,
        dailyTrends,
      };
    } catch (error) {
      console.error('Failed to get system analytics:', error);
      return { activeUsers: 0, actionBreakdown: [], dailyTrends: [] };
    }
  }

  // Cleanup old activity data to save space
  static async cleanupOldData(daysToKeep: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deleted = await db
        .delete(userActivities)
        .where(sql`${userActivities.timestamp} < ${cutoffDate.toISOString()}`);

      console.log(`Cleaned up ${deleted} old activity records`);
      return deleted;
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
      return 0;
    }
  }
}

// Middleware to automatically track API requests
export function trackingMiddleware(req: any, res: any, next: any) {
  // Only track authenticated API requests
  if (req.path.startsWith('/api') && req.user) {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Log the activity after response is sent
      const action = getActionFromRequest(req);
      if (action) {
        ActivityTracker.logActivity({
          userId: req.user.id,
          action,
          resourceType: getResourceTypeFromPath(req.path),
          resourceId: req.params.id,
          sessionId: req.sessionID,
          req,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: Date.now() - req.startTime,
          },
        });
      }
      
      return originalSend.call(this, data);
    };
  }
  
  req.startTime = Date.now();
  next();
}

// Helper functions
function getActionFromRequest(req: any): string | null {
  const { method, path } = req;
  
  if (path === '/api/auth/user' && method === 'GET') return 'view_profile';
  if (path === '/api/bucket-list' && method === 'GET') return 'view_dashboard';
  if (path === '/api/bucket-list' && method === 'POST') return 'create_item';
  if (path.includes('/api/bucket-list/') && method === 'PUT') return 'update_item';
  if (path.includes('/api/bucket-list/') && method === 'DELETE') return 'delete_item';
  if (path.includes('/api/bucket-list/') && method === 'GET') return 'view_item';
  
  return 'api_request';
}

function getResourceTypeFromPath(path: string): string | undefined {
  if (path.includes('/bucket-list')) return 'bucket_item';
  if (path.includes('/auth')) return 'user_profile';
  return undefined;
}

