import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query'
import { setupApiStore } from '../../tests/utils/helpers'

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

describe('Tag Invalidation Performance', () => {
  test('measures CPU time for tag invalidation with large cache', async () => {
    // 1. Create API with multiple endpoints
    const api = createApi({
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

    const storeRef = setupApiStore(api, undefined, {
      withoutTestLifecycles: true,
    })

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
    storeRef.store.dispatch(api.util.upsertQueryEntries(entries as any))

    const setupTime = performance.now() - startSetup
    console.log(
      `Setup time (${NUM_CACHE_ENTRIES} entries): ${setupTime.toFixed(2)}ms`,
    )

    // 3. Verify cache is populated
    const state = storeRef.store.getState()
    const cacheSize = Object.keys(state.api.queries).length
    expect(cacheSize).toBe(NUM_CACHE_ENTRIES)

    // 4. Count how many entries will be affected by invalidation
    const affectedEntries = api.util.selectInvalidatedBy(state, [
      TAG_TO_INVALIDATE,
    ])
    console.log(
      `Entries affected by invalidating ${TAG_TO_INVALIDATE}: ${affectedEntries.length}`,
    )

    // 5. Measure invalidation performance
    const startInvalidation = performance.now()

    await storeRef.store.dispatch(
      (api.endpoints as any).invalidateTag.initiate(TAG_TO_INVALIDATE),
    )

    const invalidationTime = performance.now() - startInvalidation
    console.log(`Invalidation time: ${invalidationTime.toFixed(2)}ms`)

    // 6. Performance assertions
    expect(setupTime).toBeLessThan(200) // Setup should be reasonably fast
    expect(invalidationTime).toBeLessThan(200) // Invalidation should be fast

    // 7. Verify invalidation worked
    const newState = storeRef.store.getState()
    const invalidatedCount = affectedEntries.filter(({ queryCacheKey }) => {
      const entry = newState.api.queries[queryCacheKey]
      return entry?.status === 'pending' // Should be refetching
    }).length

    console.log(`Entries refetching after invalidation: ${invalidatedCount}`)
  })

  test('measures selectInvalidatedBy performance with various tag patterns', () => {
    // Similar setup but focuses on selector performance
    const api = createApi({
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

    const storeRef = setupApiStore(api, undefined, {
      withoutTestLifecycles: true,
    })

    // Populate cache
    const entries = Array.from({ length: NUM_CACHE_ENTRIES }, (_, i) => ({
      endpointName: 'getData',
      arg: i,
      value: { id: i, data: `Data ${i}` },
    }))

    storeRef.store.dispatch(api.util.upsertQueryEntries(entries as any))

    const state = storeRef.store.getState()

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
      expect(duration).toBeLessThan(20) // Should be very fast
    })
  })

  test('measures hasPendingRequests performance with large cache', async () => {
    // This test specifically targets the hasPendingRequests optimization opportunity
    const api = createApi({
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

    const storeRef = setupApiStore(api, undefined, {
      withoutTestLifecycles: true,
    })

    // Populate with many entries
    const entries = Array.from({ length: NUM_CACHE_ENTRIES }, (_, i) => ({
      endpointName: 'getData',
      arg: i,
      value: { id: i },
    }))

    storeRef.store.dispatch(api.util.upsertQueryEntries(entries as any))

    // Trigger invalidation which will cause hasPendingRequests to be called repeatedly
    const start = performance.now()

    await storeRef.store.dispatch(
      api.endpoints.invalidateAll.initiate(undefined) as any,
    )

    const duration = performance.now() - start
    console.log(
      `Invalidation triggering hasPendingRequests: ${duration.toFixed(2)}ms`,
    )

    // This should highlight the O(n) iteration issue if it exists
    expect(duration).toBeLessThan(200)
  })

  test('measures tag calculation performance during cache population', () => {
    // This test measures the performance of calculateProvidedBy
    const api = createApi({
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

    const storeRef = setupApiStore(api, undefined, {
      withoutTestLifecycles: true,
    })

    // Measure time to populate cache with complex tag calculations
    const entries = Array.from({ length: 100 }, (_, i) => ({
      endpointName: 'getComplexData',
      arg: i,
      value: { id: i, data: `Complex data ${i}` },
    }))

    const start = performance.now()
    storeRef.store.dispatch(api.util.upsertQueryEntries(entries as any))
    const duration = performance.now() - start

    console.log(
      `Tag calculation for 100 entries with ${NUM_TAGS * 3} tags each: ${duration.toFixed(2)}ms`,
    )

    // Verify tags were calculated correctly
    const state = storeRef.store.getState()
    const providedTags = state.api.provided

    // Count total tag subscriptions
    let totalSubscriptions = 0
    Object.values(providedTags.tags).forEach((tagIds: any) => {
      Object.values(tagIds).forEach((cacheKeys: any) => {
        totalSubscriptions += cacheKeys.length
      })
    })

    console.log(`Total tag subscriptions created: ${totalSubscriptions}`)
    expect(totalSubscriptions).toBeGreaterThan(0)
    expect(duration).toBeLessThan(100)
  })

  test('measures performance of repeated invalidations', async () => {
    // This test simulates a scenario where multiple mutations invalidate tags rapidly
    const api = createApi({
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

    const storeRef = setupApiStore(api, undefined, {
      withoutTestLifecycles: true,
    })

    // Populate cache
    const entries = Array.from({ length: 200 }, (_, i) => ({
      endpointName: 'getData',
      arg: i,
      value: { id: i },
    }))

    storeRef.store.dispatch(api.util.upsertQueryEntries(entries as any))

    // Perform multiple rapid invalidations
    const numInvalidations = 10
    const start = performance.now()

    const promises = []
    for (let i = 0; i < numInvalidations; i++) {
      promises.push(
        storeRef.store.dispatch(
          api.endpoints.updateData.initiate(i % NUM_TAGS) as any,
        ),
      )
    }

    await Promise.all(promises)

    const duration = performance.now() - start
    const avgPerInvalidation = duration / numInvalidations

    console.log(
      `${numInvalidations} rapid invalidations: ${duration.toFixed(2)}ms total, ${avgPerInvalidation.toFixed(2)}ms avg`,
    )

    expect(avgPerInvalidation).toBeLessThan(50)
  })
})
