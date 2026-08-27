process.env.NODE_ENV = 'test';
process.env.PERSISTENCE_PROVIDER = 'filesystem';

import assert from 'assert';
import fs from 'fs';
import path from 'path';

const PORT = 3890;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;
const TEST_DATA_DIR = path.join(process.cwd(), 'data-http-test-temp');

process.env.DATA_DIR = TEST_DATA_DIR;

async function runApiTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING HTTP API PERSISTENCE TESTS');
  console.log('========================================\n');

  // Prepare clean isolated test data directory
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

  // Copy sample files to test dir
  const srcPrompts = path.join(process.cwd(), 'data', 'prompts.json');
  const srcCategories = path.join(process.cwd(), 'data', 'categories.json');
  if (fs.existsSync(srcPrompts)) {
    fs.copyFileSync(srcPrompts, path.join(TEST_DATA_DIR, 'prompts.json'));
  }
  if (fs.existsSync(srcCategories)) {
    fs.copyFileSync(srcCategories, path.join(TEST_DATA_DIR, 'categories.json'));
  }

  // Import server after setting NODE_ENV and DATA_DIR
  const { startServer } = await import('../server');

  // --- BOOT SERVER INSTANCE 1 ---
  console.log('▶ [API 1] Booting Server Instance 1');
  const instance1 = await startServer(PORT);
  
  // 1. GET initial prompts
  const resInitial = await fetch(`${BASE_URL}/prompts`);
  assert.strictEqual(resInitial.status, 200);
  const initialPrompts: any = await resInitial.json();
  const initialCount = initialPrompts.length;
  console.log(`✓ Initial API prompts count: ${initialCount}`);

  // 2. POST create prompt
  console.log('\n▶ [API 2] Creating Prompt via HTTP POST /api/prompts');
  const newPromptPayload = {
    title: 'Prompt HTTP Teste',
    rawPrompt: 'Fotografia macro de gotas de orvalho em uma folha esmeralda',
    targetModel: 'flux-1-pro',
    category: 'cat-photorealism',
    tags: ['HTTP', 'Macro', 'Orvalho'],
    structured: {
      subject: 'Gotas de orvalho',
      environment: 'Jardim matinal',
      lighting: 'Luz difusa',
      camera: '100mm macro',
      composition: 'Close-up extremo',
      style: 'Fotorrealismo',
      colors: 'Verde esmeralda e reflexos cristalinos',
    },
  };

  const createRes = await fetch(`${BASE_URL}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPromptPayload),
  });
  assert.strictEqual(createRes.status, 201, 'HTTP status for creation must be 201');
  const createdPrompt: any = await createRes.json();
  const promptId = createdPrompt.id;
  console.log(`✓ Created Prompt ID via API: ${promptId}`);

  // 3. Confirm prompt exists
  const getRes = await fetch(`${BASE_URL}/prompts/${promptId}`);
  assert.strictEqual(getRes.status, 200);
  const fetchedPrompt: any = await getRes.json();
  assert.strictEqual(fetchedPrompt.id, promptId);

  // --- SHUT DOWN SERVER 1 ---
  console.log('\n▶ [API 3] Shutting down Server Instance 1...');
  instance1.server.closeAllConnections?.();
  await new Promise<void>((resolve) => instance1.server.close(() => resolve()));
  await new Promise((r) => setTimeout(r, 200));
  console.log('✓ Server Instance 1 completely stopped.');

  // --- BOOT SERVER INSTANCE 2 (RESTART 1) ---
  console.log('\n▶ [API 4] Booting Server Instance 2 (RESTART 1)...');
  const instance2 = await startServer(PORT);
  await new Promise((r) => setTimeout(r, 200));

  // 4. Verify prompt survived complete restart
  const getAfterRestartRes = await fetch(`${BASE_URL}/prompts/${promptId}`);
  assert.strictEqual(getAfterRestartRes.status, 200, 'Created prompt MUST be available after server restart');
  const recoveredPrompt: any = await getAfterRestartRes.json();
  assert.strictEqual(recoveredPrompt.id, promptId);
  assert.strictEqual(recoveredPrompt.title, newPromptPayload.title);
  console.log(`✓ Confirmed: Prompt ${promptId} successfully recovered via HTTP after restart!`);

  // 5. Update prompt
  console.log('\n▶ [API 5] Updating Prompt via HTTP PUT');
  const putRes = await fetch(`${BASE_URL}/prompts/${promptId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Prompt HTTP Teste (ATUALIZADO)' }),
  });
  assert.strictEqual(putRes.status, 200);

  // 6. Favorite & Copy
  console.log('\n▶ [API 6] Toggling Favorite & Incrementing Copy via HTTP');
  const favRes = await fetch(`${BASE_URL}/prompts/${promptId}/favorite`, { method: 'POST' });
  assert.strictEqual(favRes.status, 200);
  const copyRes = await fetch(`${BASE_URL}/prompts/${promptId}/copy`, { method: 'POST' });
  assert.strictEqual(copyRes.status, 200);

  // --- SHUT DOWN SERVER 2 ---
  console.log('\n▶ [API 7] Shutting down Server Instance 2...');
  instance2.server.closeAllConnections?.();
  await new Promise<void>((resolve) => instance2.server.close(() => resolve()));
  await new Promise((r) => setTimeout(r, 200));

  // --- BOOT SERVER INSTANCE 3 (RESTART 2) ---
  console.log('\n▶ [API 8] Booting Server Instance 3 (RESTART 2)...');
  const instance3 = await startServer(PORT);
  await new Promise((r) => setTimeout(r, 200));

  // 7. Verify all edits, favorite, and copyCount survived Restart 2
  const finalGetRes = await fetch(`${BASE_URL}/prompts/${promptId}`);
  assert.strictEqual(finalGetRes.status, 200);
  const finalPrompt: any = await finalGetRes.json();
  assert.strictEqual(finalPrompt.title, 'Prompt HTTP Teste (ATUALIZADO)');
  assert.strictEqual(finalPrompt.isFavorite, true);
  assert.strictEqual(finalPrompt.copyCount, 1);
  console.log('✓ Confirmed: Edits, Favorite status, and Copy Count survived RESTART 2!');

  // Close Server 3
  await new Promise<void>((resolve) => instance3.server.close(() => resolve()));
  console.log('✓ Server Instance 3 closed.');

  // Cleanup temp test dir
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }

  console.log('\n========================================');
  console.log('🎉 ALL HTTP API PERSISTENCE TESTS PASSED');
  console.log('========================================\n');
}

runApiTests().catch((err) => {
  console.error('\n❌ API TEST FAILED:', err);
  process.exit(1);
});
