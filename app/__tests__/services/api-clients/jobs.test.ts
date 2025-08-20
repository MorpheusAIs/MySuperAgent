import { JobsAPI } from '@/services/api-clients/jobs'

describe('JobsAPI', () => {
  describe('calculateNextRunTime', () => {
    it('should calculate daily schedule correctly', () => {
      const now = new Date('2024-01-01T10:00:00Z')
      const nextRun = JobsAPI.calculateNextRunTime('daily', now)
      
      expect(nextRun).toBeInstanceOf(Date)
      expect(nextRun.getTime()).toBeGreaterThan(now.getTime())
      expect(nextRun.getDate()).toBe(now.getDate() + 1)
    })

    it('should calculate weekly schedule correctly', () => {
      const now = new Date('2024-01-01T10:00:00Z')
      const nextRun = JobsAPI.calculateNextRunTime('weekly', now)
      
      expect(nextRun).toBeInstanceOf(Date)
      expect(nextRun.getTime()).toBeGreaterThan(now.getTime())
      expect(nextRun.getDate()).toBe(now.getDate() + 7)
    })

    it('should handle custom interval', () => {
      const now = new Date('2024-01-01T10:00:00Z')
      const nextRun = JobsAPI.calculateNextRunTime('custom', now, 3)
      
      expect(nextRun).toBeInstanceOf(Date)
      expect(nextRun.getTime()).toBeGreaterThan(now.getTime())
      expect(nextRun.getDate()).toBe(now.getDate() + 3)
    })

    it('should return same time for one-time schedule', () => {
      const now = new Date('2024-01-01T10:00:00Z')
      const nextRun = JobsAPI.calculateNextRunTime('once', now)
      
      expect(nextRun).toBeInstanceOf(Date)
      expect(nextRun.getTime()).toBe(now.getTime())
    })
  })
})