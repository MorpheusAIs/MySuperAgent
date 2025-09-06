/**
 * Keepalive service for development environments
 * In production, use external cron services (Vercel Cron, GitHub Actions, etc.)
 */

export class KeepaliveService {
  private static instance: KeepaliveService;
  private keepaliveInterval: NodeJS.Timeout | null = null;
  private readonly KEEPALIVE_INTERVAL_MS = 30 * 1000; // 30 seconds
  
  private constructor() {}
  
  static getInstance(): KeepaliveService {
    if (!KeepaliveService.instance) {
      KeepaliveService.instance = new KeepaliveService();
    }
    return KeepaliveService.instance;
  }
  
  startKeepalive(): void {
    // Only start keepalive in development
    if (process.env.NODE_ENV !== 'development') {
      console.log('[KEEPALIVE] Skipping keepalive in production (use external cron)');
      return;
    }
    
    if (this.keepaliveInterval) {
      console.log('[KEEPALIVE] Keepalive already running');
      return;
    }
    
    console.log('[KEEPALIVE] Starting development keepalive service');
    
    this.keepaliveInterval = setInterval(async () => {
      try {
        // Ping the scheduler to keep it active
        const { jobScheduler } = await import('./scheduler-service');
        const status = jobScheduler.getStatus();
        
        if (!status.schedulerActive) {
          console.log('[KEEPALIVE] Scheduler not active, restarting...');
          jobScheduler.startScheduler();
        } else {
          console.log(`[KEEPALIVE] Scheduler active, last run: ${status.lastRun || 'never'}`);
        }
        
        // Also ping cleanup service
        const { cleanupService } = await import('./cleanup-service');
        const cleanupStatus = cleanupService.getStatus();
        if (!cleanupStatus.automaticCleanupActive) {
          console.log('[KEEPALIVE] Cleanup service not active, restarting...');
          cleanupService.startAutomaticCleanup();
        }
        
      } catch (error) {
        console.error('[KEEPALIVE] Error during keepalive check:', error);
      }
    }, this.KEEPALIVE_INTERVAL_MS);
  }
  
  stopKeepalive(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
      console.log('[KEEPALIVE] Keepalive stopped');
    }
  }
}

export const keepaliveService = KeepaliveService.getInstance();