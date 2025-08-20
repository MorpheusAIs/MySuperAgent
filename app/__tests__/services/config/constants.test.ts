describe('Constants Configuration', () => {
  it('should export BASE_URL', () => {
    const constants = require('@/services/config/constants')
    expect(constants.default).toBeDefined()
    expect(typeof constants.default).toBe('string')
  })

  it('should export CACHE constants', () => {
    const { CACHE_KEY_MODELS, CACHE_KEY_AGENTS, CACHE_DURATION } = require('@/services/config/constants')
    expect(CACHE_KEY_MODELS).toBe('available_models')
    expect(CACHE_KEY_AGENTS).toBe('available_agents')
    expect(CACHE_DURATION).toBe(10 * 60 * 1000) // 10 minutes
  })

  it('should export AGENT_STATUS', () => {
    const { AGENT_STATUS } = require('@/services/config/constants')
    expect(AGENT_STATUS).toBeDefined()
    expect(AGENT_STATUS.ONLINE).toBe('online')
    expect(AGENT_STATUS.OFFLINE).toBe('offline')
    expect(AGENT_STATUS.ERROR).toBe('error')
  })
})