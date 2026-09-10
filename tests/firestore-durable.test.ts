import assert from 'assert';
import { FirestorePromptRepository } from '../server/repositories/firestorePromptRepository';

async function runFirestoreDurableTests() {
  console.log('\n=================================================');
  console.log('🧪 RUNNING DURABLE FIRESTORE PERSISTENCE TESTS');
  console.log('=================================================\n');

  const repo = new FirestorePromptRepository();
  await repo.init();

  const prompts = await repo.getPrompts();
  console.log(`✓ Firestore connected. Found ${prompts.length} prompts in database.`);
  assert(prompts.length >= 15, 'Should have at least 15 prompts seeded');

  // Test Create
  const testId = `test-durable-${Date.now()}`;
  console.log(`▶ Creating test prompt: ${testId}`);
  const created = await repo.createPrompt({
    id: testId,
    title: 'Durable Cloud Test Prompt',
    rawPrompt: 'A serene mountain lake at dawn, ultra-photorealistic',
    targetModel: 'flux-1-pro',
    category: 'cat-landscapes',
    tags: ['cloud', 'test'],
    isFavorite: false,
    copyCount: 0,
    structured: {
      subject: 'Mountain lake',
      environment: 'Dawn atmosphere',
      lighting: 'Golden hour',
      camera: '50mm',
      composition: 'Wide shot',
      style: 'Photorealistic',
      colors: 'Cool blue and warm amber',
      instructions: 'Ultra-detail',
      parameters: { aspectRatio: '16:9' },
    },
  });
  assert.strictEqual(created.id, testId);
  console.log('✓ Created prompt successfully in Firestore');

  // Test Read by ID
  const fetched = await repo.getPromptById(testId);
  assert(fetched !== null);
  assert.strictEqual(fetched?.title, 'Durable Cloud Test Prompt');
  console.log('✓ Fetched prompt from Firestore');

  // Test Favorite
  const favorited = await repo.toggleFavorite(testId);
  assert.strictEqual(favorited?.isFavorite, true);
  console.log('✓ Toggled favorite in Firestore');

  // Test Increment Copy
  const copied = await repo.incrementCopyCount(testId);
  assert.strictEqual(copied?.copyCount, 1);
  console.log('✓ Incremented copy count in Firestore');

  // Test Update
  const updated = await repo.updatePrompt(testId, { title: 'Updated Cloud Prompt' });
  assert.strictEqual(updated?.title, 'Updated Cloud Prompt');
  console.log('✓ Updated prompt in Firestore');

  // Test Clean up Delete
  const deleted = await repo.deletePrompt(testId);
  assert.strictEqual(deleted, true);
  const afterDelete = await repo.getPromptById(testId);
  assert.strictEqual(afterDelete, null);
  console.log('✓ Deleted test prompt from Firestore');

  console.log('\n=================================================');
  console.log('🎉 ALL DURABLE FIRESTORE TESTS PASSED!');
  console.log('=================================================\n');
}

runFirestoreDurableTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('❌ DURABLE FIRESTORE TEST FAILED:', err);
  process.exit(1);
});
