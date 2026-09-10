import assert from 'assert';
import path from 'path';
import fs from 'fs';
import {
  getPromptRepository,
  _resetRepositoryInstanceForTesting,
  getActivePersistenceProvider,
  FilePromptRepository,
  FirestorePromptRepository,
} from '../server/repositories';

const TEST_DATA_DIR = path.join(process.cwd(), 'data-provider-test-temp');

async function runProviderSelectionTests() {
  console.log('\n=================================================');
  console.log('🧪 RUNNING PERSISTENCE PROVIDER SELECTION TESTS');
  console.log('=================================================\n');

  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

  const originalEnv = { ...process.env };

  try {
    // --- TEST 1: Default in non-production environment is filesystem ---
    console.log('▶ [Test 1] Non-production default resolves to FilePromptRepository');
    delete process.env.PERSISTENCE_PROVIDER;
    delete process.env.K_SERVICE;
    process.env.NODE_ENV = 'test';
    process.env.DATA_DIR = TEST_DATA_DIR;
    _resetRepositoryInstanceForTesting();

    const repo1 = await getPromptRepository();
    assert(repo1 instanceof FilePromptRepository, 'Should default to FilePromptRepository in non-production');
    assert.strictEqual(getActivePersistenceProvider(), 'filesystem');
    console.log('✓ Confirmed: default non-production provider is filesystem');

    // --- TEST 2: Explicit filesystem provider works ---
    console.log('\n▶ [Test 2] Explicit PERSISTENCE_PROVIDER=filesystem resolves to FilePromptRepository');
    process.env.PERSISTENCE_PROVIDER = 'filesystem';
    _resetRepositoryInstanceForTesting();

    const repo2 = await getPromptRepository();
    assert(repo2 instanceof FilePromptRepository, 'Explicit filesystem should return FilePromptRepository');
    assert.strictEqual(getActivePersistenceProvider(), 'filesystem');
    console.log('✓ Confirmed: explicit filesystem provider works');

    // --- TEST 3: Cloud Run ephemeral filesystem guardrail triggers ---
    console.log('\n▶ [Test 3] Cloud Run ephemeral filesystem guardrail prevents data loss');
    process.env.PERSISTENCE_PROVIDER = 'filesystem';
    process.env.K_SERVICE = 'dan-images-prompts-service';
    delete process.env.ALLOW_EPHEMERAL_FILESYSTEM;
    _resetRepositoryInstanceForTesting();

    let guardrailTriggered = false;
    try {
      await getPromptRepository();
    } catch (err: any) {
      guardrailTriggered = true;
      assert(err.message.includes('prohibited on Cloud Run'), 'Error should explain Cloud Run ephemeral storage prohibition');
      console.log(`✓ Caught expected guardrail error: ${err.message}`);
    }
    assert.strictEqual(guardrailTriggered, true, 'Must reject ephemeral filesystem on Cloud Run without bypass flag');

    // --- TEST 4: Cloud Run with ALLOW_EPHEMERAL_FILESYSTEM=true bypasses guardrail for debugging ---
    console.log('\n▶ [Test 4] Cloud Run with ALLOW_EPHEMERAL_FILESYSTEM=true allows filesystem bypass');
    process.env.ALLOW_EPHEMERAL_FILESYSTEM = 'true';
    _resetRepositoryInstanceForTesting();

    const repoBypass = await getPromptRepository();
    assert(repoBypass instanceof FilePromptRepository, 'Should allow filesystem when ALLOW_EPHEMERAL_FILESYSTEM=true');
    console.log('✓ Confirmed: explicit bypass allows filesystem on container');
    delete process.env.ALLOW_EPHEMERAL_FILESYSTEM;
    delete process.env.K_SERVICE;

    // --- TEST 5: Fail-closed on Firestore initialization error (NO SILENT FALLBACK) ---
    console.log('\n▶ [Test 5] PERSISTENCE_PROVIDER=firestore fails closed on error (no silent fallback)');
    process.env.PERSISTENCE_PROVIDER = 'firestore';
    // Set invalid / unreachable project or config to force failure
    process.env.GOOGLE_CLOUD_PROJECT = 'non-existent-test-project-xyz';
    process.env.FIRESTORE_DATABASE_ID = 'invalid-db-id-xyz';
    _resetRepositoryInstanceForTesting();

    let firestoreFailedClosed = false;
    try {
      await getPromptRepository();
    } catch (err: any) {
      firestoreFailedClosed = true;
      assert(err.message.includes('Fatal: Failed to initialize Firestore repository'), 'Must throw fatal error on failure');
      assert(err.message.includes('Silent fallback to ephemeral filesystem is strictly prohibited'), 'Must mention prohibition of silent fallback');
      console.log(`✓ Confirmed fail-closed behavior: caught fatal error: ${err.message}`);
    }
    assert.strictEqual(firestoreFailedClosed, true, 'Must fail closed when Firestore initialization fails; no silent fallback to FilePromptRepository allowed');

    // --- TEST 6: Production environment defaults to firestore ---
    console.log('\n▶ [Test 6] Production environment defaults to firestore without silent fallback');
    delete process.env.PERSISTENCE_PROVIDER;
    process.env.NODE_ENV = 'production';
    _resetRepositoryInstanceForTesting();

    let prodDefaultFailedClosed = false;
    try {
      await getPromptRepository();
    } catch (err: any) {
      prodDefaultFailedClosed = true;
      assert(err.message.includes('Fatal: Failed to initialize Firestore repository'), 'Must attempt Firestore and fail closed if unconfigured in production');
      console.log(`✓ Confirmed: production defaults to firestore and rejects fallback: ${err.message}`);
    }
    assert.strictEqual(prodDefaultFailedClosed, true, 'Production without PERSISTENCE_PROVIDER must attempt Firestore');

  } finally {
    // Restore environment
    process.env = originalEnv;
    _resetRepositoryInstanceForTesting();
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  }

  console.log('\n=================================================');
  console.log('🎉 ALL PROVIDER SELECTION TESTS PASSED (6/6)');
  console.log('=================================================\n');
}

runProviderSelectionTests().catch((err) => {
  console.error('\n❌ PROVIDER SELECTION TEST FAILED:', err);
  process.exit(1);
});
