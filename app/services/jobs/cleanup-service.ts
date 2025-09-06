import { getHttpClient } from '@/services/config/constants';

export interface CleanupResult {
  success: boolean;
  processed: number;
  rescued: number;
  failed: number;
  errors: string[];
  stuckJobs: Array<{
    id: string;
    wallet_address: string;
    name: string;
    status: string;
    minutes_stuck: number;
  }>;
}

export class JobCleanupService {
  private static instance: JobCleanupService;
  private isRunning = false;
  private lastCleanup: Date | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Run every 5 minutes
  private readonly MIN_INTERVAL_BETWEEN_CLEANUPS_MS = 2 * 60 * 1000; // At least 2 minutes between runs

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): JobCleanupService {
    if (!JobCleanupService.instance) {
      JobCleanupService.instance = new JobCleanupService();
    }
    return JobCleanupService.instance;
  }

  /**
   * Start automatic cleanup process
   */
  startAutomaticCleanup(): void {
    if (this.cleanupInterval) {
      console.log('[CLEANUP SERVICE] Automatic cleanup already running');
      return;
    }

    console.log('[CLEANUP SERVICE] Starting automatic cleanup process');
    
    // Run initial cleanup after a short delay
    setTimeout(() => this.runCleanup(), 10000); // 10 seconds
    
    // Set up recurring cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop automatic cleanup process
   */
  stopAutomaticCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[CLEANUP SERVICE] Automatic cleanup stopped');
    }
  }

  /**
   * Manually trigger cleanup process
   */
  async runCleanup(): Promise<CleanupResult | null> {
    if (this.isRunning) {
      console.log('[CLEANUP SERVICE] Cleanup already in progress, skipping');
      return null;
    }

    // Check minimum interval
    if (this.lastCleanup) {
      const timeSinceLastCleanup = Date.now() - this.lastCleanup.getTime();
      if (timeSinceLastCleanup < this.MIN_INTERVAL_BETWEEN_CLEANUPS_MS) {
        console.log(`[CLEANUP SERVICE] Skipping cleanup, last run was ${Math.round(timeSinceLastCleanup / 1000)}s ago`);
        return null;
      }
    }

    this.isRunning = true;
    
    try {
      console.log('[CLEANUP SERVICE] Starting cleanup process');
      
      const httpClient = getHttpClient();
      const response = await httpClient.post('/api/v1/jobs/cleanup');
      
      const result: CleanupResult = response.data;
      
      this.lastCleanup = new Date();
      
      if (result.processed > 0) {
        console.log(`[CLEANUP SERVICE] Cleanup completed: ${result.rescued} rescued, ${result.failed} failed, ${result.errors.length} errors`);
        
        if (result.errors.length > 0) {
          console.warn('[CLEANUP SERVICE] Cleanup errors:', result.errors);
        }
      } else {
        console.log('[CLEANUP SERVICE] No stuck jobs found');
      }
      
      return result;
    } catch (error) {
      console.error('[CLEANUP SERVICE] Cleanup failed:', error);
      this.lastCleanup = new Date(); // Update to prevent immediate retry
      return null;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCleanup: this.lastCleanup,
      automaticCleanupActive: this.cleanupInterval !== null,
      nextCleanupIn: this.cleanupInterval ? this.CLEANUP_INTERVAL_MS : null
    };
  }
}

// Export singleton instance
export const cleanupService = JobCleanupService.getInstance();

// Auto-start cleanup service - managed by instrumentation.ts
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Server-side only - but don't auto-start here, let instrumentation.ts handle it
  console.log('[CLEANUP SERVICE] Cleanup module loaded');
}