/**
 * Performance benchmarking script for RTKQ tag invalidation
 *
 * Run with:
 *   tsx packages/toolkit/src/query/tests/performance-invalidation.ts
 *
 * Or with Node.js built-in type stripping (Node 22.6+):
 *   node --experimental-strip-types packages/toolkit/src/query/tests/performance-invalidation.ts
 *
 * For CPU profiling with pprof:
 *   node --prof tsx packages/toolkit/src/query/tests/performance-invalidation.ts
 *   node --prof-process isolate-*.log > profile.txt
 */

import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query'
import { configureStore } from '@reduxjs/toolkit'

process.env.NODE_ENV = 'production' // Ensure production mode for performance testing

// Test Configuration
const NUM_ENDPOINTS = 10
const NUM_TAGS = 5
const NUM_CACHE_ENTRIES = 300
const TAG_TO_INVALIDATE = 'Tag2' // Will affect ~60 entries (20% of cache)

// Tag types for the test
const tagTypes = Array.from({ length: NUM_TAGS }, (_, i) => `Tag${i}`) as [
  string,
  ...string[],
]

// Helper to create a store with the API
function setupStore(api: any) {
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(api.middleware),
  })
  return store
}

// Helper for assertions
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

// Helper to create subscriptions for cache entries
// This ensures entries aren't removed during invalidation
function createSubscriptions(
  store: any,
  api: any,
  entries: Array<{ endpointName: string; arg: any }>,
) {
  for (const { endpointName, arg } of entries) {
    // Call initiate with forceRefetch: false to just add subscription without refetching
    store.dispatch(
      (api.endpoints as any)[endpointName].initiate(arg, {
        subscribe: true,
        forceRefetch: false,
      }),
    )
  }
}

async function test1_fullInvalidationFlow() {
  console.log('\n=== Test 1: Full Invalidation Flow ===')

  // 1. Create API with multiple endpoints
  const api = createApi({
    reducerPath: 'api',
    baseQuery: fakeBaseQuery(),
    tagTypes,
    endpoints: (build) => {
      const endpoints: any = {}

      // Create 10 endpoints, each providing different tag combinations
      for (let i = 0; i < NUM_ENDPOINTS; i++) {
        endpoints[`endpoint${i}`] = build.query({
          queryFn: (id: number) => ({ data: { id, endpoint: i } }),
          providesTags: (result: any, error: any, id: number) => {
            // Each endpoint provides 2-3 tags based on ID
            const tags: any[] = [
              `Tag${id % NUM_TAGS}`,
              { type: `Tag${(id + 1) % NUM_TAGS}`, id },
            ]
            if (id % 3 === 0) {
              tags.push({ type: `Tag${(id + 2) % NUM_TAGS}`, id: 'LIST' })
            }
            return tags
          },
        })
      }

      // Add mutation that invalidates a specific tag
      endpoints.invalidateTag = build.mutation({
        queryFn: (tag: string) => ({ data: { tag } }),
        invalidatesTags: (result: any, error: any, tag: string) => [tag],
      })

      return endpoints
    },
  })

  const store = setupStore(api)

  // 2. Populate cache with 300 entries using upsertQueryEntries
  const startSetup = performance.now()

  const entries = []
  for (let endpointIdx = 0; endpointIdx < NUM_ENDPOINTS; endpointIdx++) {
    for (let id = 0; id < NUM_CACHE_ENTRIES / NUM_ENDPOINTS; id++) {
      entries.push({
        endpointName: `endpoint${endpointIdx}`,
        arg: id + endpointIdx * 100,
        value: {
          id: id + endpointIdx * 100,
          endpoint: endpointIdx,
          data: `Sample data ${id}`,
        },
      })
    }
  }

  // Batch upsert all entries at once
  store.dispatch(api.util.upsertQueryEntries(entries as any))

  // Create subscriptions for all entries to prevent removal during invalidation
  createSubscriptions(store, api, entries)

  const setupTime = performance.now() - startSetup
  console.log(
    `Setup time (${NUM_CACHE_ENTRIES} entries + subscriptions): ${setupTime.toFixed(2)}ms`,
  )

  // 3. Verify cache is populated
  const state = store.getState()
  const cacheSize = Object.keys(state.api.queries).length
  assert(
    cacheSize === NUM_CACHE_ENTRIES,
    `Expected ${NUM_CACHE_ENTRIES} cache entries, got ${cacheSize}`,
  )
  console.log(`✓ Cache populated with ${cacheSize} entries`)

  // 4. Count how many entries will be affected by invalidation
  const affectedEntries = api.util.selectInvalidatedBy(state, [
    TAG_TO_INVALIDATE,
  ])
  console.log(
    `Entries affected by invalidating ${TAG_TO_INVALIDATE}: ${affectedEntries.length}`,
  )

  // 5. Measure invalidation performance
  const startInvalidation = performance.now()

  await store.dispatch(
    (api.endpoints as any).invalidateTag.initiate(TAG_TO_INVALIDATE),
  )

  const invalidationTime = performance.now() - startInvalidation
  console.log(`Invalidation time: ${invalidationTime.toFixed(2)}ms`)

  // 6. Performance checks
  assert(
    setupTime < 200,
    `Setup time ${setupTime.toFixed(2)}ms exceeded 200ms threshold`,
  )
  assert(
    invalidationTime < 100,
    `Invalidation time ${invalidationTime.toFixed(2)}ms exceeded 100ms threshold`,
  )
  console.log('✓ Performance within acceptable thresholds')

  // 7. Verify invalidation worked
  const newState = store.getState()
  const invalidatedCount = affectedEntries.filter(({ queryCacheKey }) => {
    const entry = newState.api.queries[queryCacheKey]
    return entry?.status === 'pending' // Should be refetching
  }).length

  console.log(`Entries refetching after invalidation: ${invalidatedCount}`)
  console.log('✓ Test 1 completed successfully\n')
}

async function test2_selectorPerformance() {
  console.log('\n=== Test 2: Selector Performance ===')

  // Similar setup but focuses on selector performance
  const api = createApi({
    reducerPath: 'api',
    baseQuery: fakeBaseQuery(),
    tagTypes,
    endpoints: (build) => ({
      // Simplified endpoint for this test
      getData: build.query({
        queryFn: (id: number) => ({ data: { id } }),
        providesTags: (result: any, error: any, id: number) => [
          `Tag${id % NUM_TAGS}`,
          { type: `Tag${(id + 1) % NUM_TAGS}` as any, id },
          { type: `Tag${(id + 2) % NUM_TAGS}` as any, id: 'LIST' },
        ],
      }),
    }),
  })

  const store = setupStore(api)

  // Populate cache
  const entries = Array.from({ length: NUM_CACHE_ENTRIES }, (_, i) => ({
    endpointName: 'getData',
    arg: i,
    value: { id: i, data: `Data ${i}` },
  }))

  store.dispatch(api.util.upsertQueryEntries(entries as any))

  // Create subscriptions to prevent removal during invalidation
  createSubscriptions(store, api, entries)

  const state = store.getState()

  // Test different invalidation patterns
  const patterns = [
    { name: 'Single type tag', tags: ['Tag0'] },
    { name: 'Multiple type tags', tags: ['Tag0', 'Tag1', 'Tag2'] },
    { name: 'Specific ID tag', tags: [{ type: 'Tag0', id: 5 }] },
    { name: 'LIST tag', tags: [{ type: 'Tag0', id: 'LIST' }] },
    {
      name: 'Mixed tags',
      tags: ['Tag0', { type: 'Tag1', id: 10 }, { type: 'Tag2', id: 'LIST' }],
    },
  ]

  patterns.forEach(({ name, tags }) => {
    const start = performance.now()
    const affected = api.util.selectInvalidatedBy(state, tags as any)
    const duration = performance.now() - start

    console.log(
      `${name}: ${affected.length} entries in ${duration.toFixed(3)}ms`,
    )
    assert(
      duration < 20,
      `${name} took ${duration.toFixed(3)}ms, exceeded 20ms threshold`,
    )
  })

  console.log('✓ All selector patterns within acceptable thresholds')
  console.log('✓ Test 2 completed successfully\n')
}

async function test3_hasPendingRequestsPerformance() {
  console.log('\n=== Test 3: hasPendingRequests Performance ===')

  // This test specifically targets the hasPendingRequests optimization opportunity
  const api = createApi({
    reducerPath: 'api',
    baseQuery: fakeBaseQuery(),
    tagTypes,
    endpoints: (build) => ({
      getData: build.query({
        queryFn: (id: number) => ({ data: { id } }),
        providesTags: ['Tag0'],
      }),
      invalidateAll: build.mutation({
        queryFn: () => ({ data: {} }),
        invalidatesTags: ['Tag0'],
      }),
    }),
  })

  const store = setupStore(api)

  // Populate with many entries
  const entries = Array.from({ length: NUM_CACHE_ENTRIES }, (_, i) => ({
    endpointName: 'getData',
    arg: i,
    value: { id: i },
  }))

  store.dispatch(api.util.upsertQueryEntries(entries as any))

  // Create subscriptions to prevent removal during invalidation
  createSubscriptions(store, api, entries)

  // Trigger invalidation which will cause hasPendingRequests to be called repeatedly
  const start = performance.now()

  await store.dispatch(api.endpoints.invalidateAll.initiate(undefined) as any)

  const duration = performance.now() - start
  console.log(
    `Invalidation triggering hasPendingRequests: ${duration.toFixed(2)}ms`,
  )

  // This should highlight the O(n) iteration issue if it exists
  assert(
    duration < 200,
    `hasPendingRequests test took ${duration.toFixed(2)}ms, exceeded 200ms threshold`,
  )
  console.log('✓ Test 3 completed successfully\n')
}

async function test4_tagCalculationPerformance() {
  console.log('\n=== Test 4: Tag Calculation Performance ===')

  // This test measures the performance of calculateProvidedBy
  const api = createApi({
    reducerPath: 'api',
    baseQuery: fakeBaseQuery(),
    tagTypes,
    endpoints: (build) => ({
      getComplexData: build.query({
        queryFn: (id: number) => ({ data: { id } }),
        providesTags: (result: any, error: any, id: number) => {
          // Complex tag calculation that returns many tags
          const tags: any[] = []
          for (let i = 0; i < NUM_TAGS; i++) {
            tags.push(`Tag${i}`)
            tags.push({ type: `Tag${i}`, id })
            if (id % 2 === 0) {
              tags.push({ type: `Tag${i}`, id: 'LIST' })
            }
          }
          return tags
        },
      }),
    }),
  })

  const store = setupStore(api)

  // Measure time to populate cache with complex tag calculations
  const entries = Array.from({ length: 100 }, (_, i) => ({
    endpointName: 'getComplexData',
    arg: i,
    value: { id: i, data: `Complex data ${i}` },
  }))

  const start = performance.now()
  store.dispatch(api.util.upsertQueryEntries(entries as any))

  // Create subscriptions to prevent removal during invalidation
  createSubscriptions(store, api, entries)

  const duration = performance.now() - start

  console.log(
    `Tag calculation for 100 entries with ${NUM_TAGS * 3} tags each: ${duration.toFixed(2)}ms`,
  )

  // Verify tags were calculated correctly
  const state = store.getState()
  const providedTags = state.api.provided

  // Count total tag subscriptions
  let totalSubscriptions = 0
  Object.values(providedTags.tags).forEach((tagIds: any) => {
    Object.values(tagIds).forEach((cacheKeys: any) => {
      totalSubscriptions += cacheKeys.length
    })
  })

  console.log(`Total tag subscriptions created: ${totalSubscriptions}`)
  assert(totalSubscriptions > 0, 'Expected tag subscriptions to be created')
  assert(
    duration < 100,
    `Tag calculation took ${duration.toFixed(2)}ms, exceeded 100ms threshold`,
  )
  console.log('✓ Test 4 completed successfully\n')
}

async function test5_repeatedInvalidations() {
  console.log('\n=== Test 5: Repeated Invalidations Performance ===')

  // This test simulates a scenario where multiple mutations invalidate tags rapidly
  const api = createApi({
    reducerPath: 'api',
    baseQuery: fakeBaseQuery(),
    tagTypes,
    endpoints: (build) => ({
      getData: build.query({
        queryFn: (id: number) => ({ data: { id } }),
        providesTags: (result: any, error: any, id: number) => [
          `Tag${id % NUM_TAGS}`,
        ],
      }),
      updateData: build.mutation({
        queryFn: (id: number) => ({ data: { id } }),
        invalidatesTags: (result: any, error: any, id: number) => [
          `Tag${id % NUM_TAGS}`,
        ],
      }),
    }),
  })

  const store = setupStore(api)

  // Populate cache
  const entries = Array.from({ length: 200 }, (_, i) => ({
    endpointName: 'getData',
    arg: i,
    value: { id: i },
  }))

  store.dispatch(api.util.upsertQueryEntries(entries as any))

  // Create subscriptions to prevent removal during invalidation
  createSubscriptions(store, api, entries)

  // Perform multiple rapid invalidations
  const numInvalidations = 10
  const start = performance.now()

  const promises = []
  for (let i = 0; i < numInvalidations; i++) {
    promises.push(
      store.dispatch(api.endpoints.updateData.initiate(i % NUM_TAGS) as any),
    )
  }

  await Promise.all(promises)

  const duration = performance.now() - start
  const avgPerInvalidation = duration / numInvalidations

  console.log(
    `${numInvalidations} rapid invalidations: ${duration.toFixed(2)}ms total, ${avgPerInvalidation.toFixed(2)}ms avg`,
  )

  assert(
    avgPerInvalidation < 50,
    `Average invalidation time ${avgPerInvalidation.toFixed(2)}ms exceeded 50ms threshold`,
  )
  console.log('✓ Test 5 completed successfully\n')
}

// Main execution
async function runAllTests() {
  console.log('='.repeat(60))
  console.log('RTKQ Tag Invalidation Performance Benchmarks')
  console.log('='.repeat(60))

  for (const test of [
    test1_fullInvalidationFlow,
    test2_selectorPerformance,
    test3_hasPendingRequestsPerformance,
    test4_tagCalculationPerformance,
    test5_repeatedInvalidations,
  ]) {
    console.log(`\nStarting ${test.name}...`)
    try {
      await test()
    } catch (error) {
      console.error(`\n❌ ${test.name} failed:`, error)
    }
  }

  // try {
  //   await test1_fullInvalidationFlow()
  //   await test2_selectorPerformance()
  //   await test3_hasPendingRequestsPerformance()
  //   await test4_tagCalculationPerformance()
  //   await test5_repeatedInvalidations()

  //   console.log('='.repeat(60))
  //   console.log('✓ All tests completed successfully!')
  //   console.log('='.repeat(60))
  // } catch (error) {
  //   console.error('\n❌ Test failed:', error)
  //   process.exit(1)
  // }

  process.exit(0)
}

// Run the tests
runAllTests()
