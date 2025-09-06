export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Run database migrations on server startup
    const { runMigrations } = await import('@/services/database/migrations');
    
    if (process.env.DATABASE_URL) {
      try {
        console.log('🔄 Running database migrations on server startup...');
        await runMigrations(process.env.DATABASE_URL);
        console.log('✅ Database migrations completed successfully');
        
        // Start background services after successful migration
        setTimeout(async () => {
          try {
            console.log('🚀 Starting background services...');
            
            // Check if we're in a serverless environment
            const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
            if (isServerless) {
              console.log('⚠️  Detected serverless environment - background services may not persist');
              console.log('💡 Consider using external cron services for reliable scheduling');
            }
            
            // Start job scheduler
            const { jobScheduler } = await import('@/services/jobs/scheduler-service');
            jobScheduler.startScheduler();
            console.log('✅ Job scheduler started');
            
            // Start job processor (processes pending jobs created by scheduler)
            const { jobProcessor } = await import('@/services/jobs/job-processor-service');
            jobProcessor.startProcessor();
            console.log('✅ Job processor started');
            
            // Start cleanup service
            const { cleanupService } = await import('@/services/jobs/cleanup-service');
            cleanupService.startAutomaticCleanup();
            console.log('✅ Cleanup service started');
            
            // Start keepalive service (development only)
            const { keepaliveService } = await import('@/services/jobs/keepalive-service');
            keepaliveService.startKeepalive();
            console.log('✅ Keepalive service started');
            
            // Log initial scheduler status
            setTimeout(() => {
              const status = jobScheduler.getStatus();
              console.log('📊 Initial scheduler status:', {
                active: status.schedulerActive,
                lastRun: status.lastRun,
                intervalMs: status.intervalMs
              });
            }, 5000);
            
            // Test scheduler immediately to verify it works
            setTimeout(async () => {
              try {
                console.log('🧪 Running initial scheduler test...');
                const result = await jobScheduler.processScheduledJobs();
                if (result) {
                  console.log(`📋 Scheduler test: found ${result.processedJobs} jobs, executed ${result.executedJobs}`);
                } else {
                  console.log('📋 Scheduler test: skipped (already running or timing)');
                }
              } catch (testError) {
                console.error('🚨 Scheduler test failed:', testError);
              }
            }, 20000); // Test after 20 seconds
            
            console.log('🎉 All background services initialized successfully');
          } catch (serviceError) {
            console.error('❌ Failed to start background services:', serviceError);
            // Try to continue with partial functionality
          }
        }, 10000); // Start services after 10 seconds
        
      } catch (error) {
        console.error('❌ Database migration failed:', error);
        // Don't crash the server, but log the error
      }
    } else {
      console.warn('⚠️  DATABASE_URL not configured, skipping migrations and background services');
    }
  }
}