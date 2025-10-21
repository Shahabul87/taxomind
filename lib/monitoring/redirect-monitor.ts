/**
 * Redirect Monitoring System
 * Tracks access to redirected routes and 404 errors
 */

import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface RedirectLog {
  timestamp: string;
  from: string;
  to: string;
  userAgent: string;
  ip: string;
  referer?: string;
}

interface ErrorLog {
  timestamp: string;
  path: string;
  method: string;
  userAgent: string;
  ip: string;
  referer?: string;
  type: '404' | 'redirect';
}

export class RedirectMonitor {
  private static instance: RedirectMonitor;
  private redirectTrackerPath = path.join(process.cwd(), 'migrations/post-routes-redirect-tracker.json');
  private logPath = path.join(process.cwd(), 'logs');

  private constructor() {
    // Ensure log directory exists
    this.ensureLogDirectory();
  }

  static getInstance(): RedirectMonitor {
    if (!RedirectMonitor.instance) {
      RedirectMonitor.instance = new RedirectMonitor();
    }
    return RedirectMonitor.instance;
  }

  private async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Log redirect access
   */
  async logRedirectAccess(from: string, to: string, request: NextRequest) {
    try {
      // Update tracker JSON
      await this.updateTrackerCount(from);

      // Create log entry
      const log: RedirectLog = {
        timestamp: new Date().toISOString(),
        from,
        to,
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        referer: request.headers.get('referer') || undefined,
      };

      // Append to log file
      const logFile = path.join(this.logPath, 'redirect-access.log');
      await fs.appendFile(logFile, JSON.stringify(log) + '\n');

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Redirect] ${from} → ${to}`);
      }
    } catch (error) {
      console.error('Failed to log redirect access:', error);
    }
  }

  /**
   * Log 404 errors for old post routes
   */
  async log404Error(pathname: string, request: NextRequest) {
    // Only log if it's a potential old post route
    if (!pathname.startsWith('/post/')) {
      return;
    }

    try {
      const log: ErrorLog = {
        timestamp: new Date().toISOString(),
        path: pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        referer: request.headers.get('referer') || undefined,
        type: '404',
      };

      // Append to error log
      const logFile = path.join(this.logPath, '404-errors.log');
      await fs.appendFile(logFile, JSON.stringify(log) + '\n');

      // Alert in console for immediate attention
      console.error(`[404 Error] Old post route accessed: ${pathname}`);
    } catch (error) {
      console.error('Failed to log 404 error:', error);
    }
  }

  /**
   * Update redirect access count in tracker
   */
  private async updateTrackerCount(from: string) {
    try {
      const trackerData = await fs.readFile(this.redirectTrackerPath, 'utf-8');
      const tracker = JSON.parse(trackerData);

      // Find and update the redirect entry
      const redirect = tracker.redirects.find((r: any) => r.from === from);
      if (redirect) {
        redirect.accessCount++;
        redirect.lastAccessed = new Date().toISOString();
      }

      // Save updated tracker
      await fs.writeFile(this.redirectTrackerPath, JSON.stringify(tracker, null, 2));
    } catch (error) {
      console.error('Failed to update tracker count:', error);
    }
  }

  /**
   * Get redirect statistics
   */
  async getRedirectStats() {
    try {
      const trackerData = await fs.readFile(this.redirectTrackerPath, 'utf-8');
      const tracker = JSON.parse(trackerData);

      return {
        totalRedirects: tracker.redirects.reduce((sum: number, r: any) => sum + r.accessCount, 0),
        redirects: tracker.redirects.map((r: any) => ({
          from: r.from,
          to: r.to,
          accessCount: r.accessCount,
          lastAccessed: r.lastAccessed,
          daysUntilRemoval: Math.ceil(
            (new Date(r.removeAfter).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
        })),
      };
    } catch (error) {
      console.error('Failed to get redirect stats:', error);
      return null;
    }
  }

  /**
   * Check if redirects can be safely removed
   */
  async checkRedirectRemoval() {
    try {
      const stats = await this.getRedirectStats();
      if (!stats) return [];

      const safeToRemove = stats.redirects.filter((r: any) => {
        // Safe to remove if:
        // 1. Not accessed in last 30 days
        // 2. Access count is very low (< 10)
        // 3. Past the removal date
        const lastAccessed = r.lastAccessed ? new Date(r.lastAccessed) : null;
        const daysSinceLastAccess = lastAccessed
          ? Math.ceil((new Date().getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;

        return (
          daysSinceLastAccess > 30 ||
          (r.accessCount < 10 && r.daysUntilRemoval <= 0)
        );
      });

      return safeToRemove;
    } catch (error) {
      console.error('Failed to check redirect removal:', error);
      return [];
    }
  }
}

// Export singleton instance
export const redirectMonitor = RedirectMonitor.getInstance();