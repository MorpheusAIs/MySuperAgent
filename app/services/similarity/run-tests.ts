/**
 * Test runner for similarity services
 * Run with: npx ts-node app/services/similarity/run-tests.ts
 */

import { testConfiguration, testSimilarity } from './test-similarity';

async function runTests() {
  console.log('🧪 Running Similarity Service Tests\n');
  console.log('='.repeat(60));

  try {
    // Test configuration
    console.log('\n1. Testing Configuration...');
    testConfiguration();

    // Test similarity functionality
    console.log('\n2. Testing Similarity Detection...');
    await testSimilarity();

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
