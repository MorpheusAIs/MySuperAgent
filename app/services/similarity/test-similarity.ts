/**
 * Test script to demonstrate TF-IDF similarity functionality
 * This can be run to test the similarity detection without the full chat system
 */

import { TFIDFSimilarityService } from './tf-idf-similarity.js';

// Mock message data for testing
const mockMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'How do I create a React component?',
    job_id: 'job1',
    created_at: new Date('2024-01-01'),
    order_index: 1,
    metadata: {},
    requires_action: false,
    is_streaming: false,
  },
  {
    id: '2',
    role: 'assistant' as const,
    content:
      'You can create a React component using the function component syntax or class component syntax...',
    job_id: 'job1',
    created_at: new Date('2024-01-01'),
    order_index: 2,
    metadata: {},
    requires_action: false,
    is_streaming: false,
  },
  {
    id: '3',
    role: 'user' as const,
    content: 'What is the best way to structure React components?',
    job_id: 'job2',
    created_at: new Date('2024-01-02'),
    order_index: 1,
    metadata: {},
    requires_action: false,
    is_streaming: false,
  },
  {
    id: '4',
    role: 'assistant' as const,
    content:
      'For React component structure, I recommend organizing components in folders by feature...',
    job_id: 'job2',
    created_at: new Date('2024-01-02'),
    order_index: 2,
    metadata: {},
    requires_action: false,
    is_streaming: false,
  },
  {
    id: '5',
    role: 'user' as const,
    content: 'How do I build a React component with hooks?',
    job_id: 'job3',
    created_at: new Date('2024-01-03'),
    order_index: 1,
    metadata: {},
    requires_action: false,
    is_streaming: false,
  },
  {
    id: '6',
    role: 'assistant' as const,
    content:
      'To build a React component with hooks, start with useState for state management...',
    job_id: 'job3',
    created_at: new Date('2024-01-03'),
    order_index: 2,
    metadata: {},
    requires_action: false,
    is_streaming: false,
  },
  {
    id: '7',
    role: 'user' as const,
    content: 'What is the weather like today?',
    job_id: 'job4',
    created_at: new Date('2024-01-04'),
    order_index: 1,
    metadata: {},
    requires_action: false,
    is_streaming: false,
  },
  {
    id: '8',
    role: 'assistant' as const,
    content:
      "I don't have access to real-time weather data, but you can check your local weather app...",
    job_id: 'job4',
    created_at: new Date('2024-01-04'),
    order_index: 2,
    metadata: {},
    requires_action: false,
    is_streaming: false,
  },
];

async function testSimilarity() {
  console.log('🧪 Testing TF-IDF Similarity Service\n');

  const similarityService = new TFIDFSimilarityService({
    similarityThreshold: 0.5,
    maxSimilarPrompts: 3,
    minPromptLength: 5,
  });

  // Test cases
  const testPrompts = [
    'How do I create a React component?', // Should find similar prompts
    'What is the best way to build React components?', // Should find similar prompts
    'How do I build a React component with hooks?', // Should find similar prompts
    'What is the weather like today?', // Should find the weather prompt
    'How do I cook pasta?', // Should not find similar prompts
    'Tell me about quantum physics', // Should not find similar prompts
  ];

  for (const testPrompt of testPrompts) {
    console.log(`\n📝 Testing prompt: "${testPrompt}"`);
    console.log('─'.repeat(60));

    try {
      const similarPrompts = await similarityService.findSimilarPrompts(
        testPrompt,
        mockMessages,
        'test-wallet'
      );

      if (similarPrompts.length === 0) {
        console.log('❌ No similar prompts found');
      } else {
        console.log(`✅ Found ${similarPrompts.length} similar prompts:`);

        similarPrompts.forEach((similar, index) => {
          const similarityPercent = Math.round(similar.similarity * 100);
          console.log(`\n  ${index + 1}. Similarity: ${similarityPercent}%`);
          console.log(`     Previous: "${similar.prompt}"`);
          console.log(
            `     Response: "${similar.response.substring(0, 80)}..."`
          );
        });

        // Generate context
        const context =
          similarityService.generateSimilarityContext(similarPrompts);
        console.log('\n📋 Generated Context:');
        console.log(context.substring(0, 200) + '...');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  console.log('\n🎉 Test completed!');
}

// Configuration test
function testConfiguration() {
  console.log('\n⚙️  Testing Configuration\n');

  const service = new TFIDFSimilarityService();

  console.log('Default config:', service.getConfig());

  service.updateConfig({
    similarityThreshold: 0.8,
    maxSimilarPrompts: 5,
  });

  console.log('Updated config:', service.getConfig());
}

// Run tests if this file is executed directly
if (require.main === module) {
  testConfiguration();
  testSimilarity().catch(console.error);
}

export { testConfiguration, testSimilarity };
