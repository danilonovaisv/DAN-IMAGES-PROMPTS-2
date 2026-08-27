import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { FilePromptRepository } from '../server/repositories/filePromptRepository';
import { CreatePromptInput } from '../server/repositories/promptRepository';

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING PERSISTENCE REGRESSION TESTS');
  console.log('========================================\n');

  const testDir = path.join(process.cwd(), 'data-test-temp');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // --- STEP 1: INITIAL BOOT ---
  console.log('▶ [Test 1] Initial Boot & Seed Verification');
  let repo = new FilePromptRepository(testDir);
  await repo.init();

  const initialPrompts = await repo.getPrompts();
  const initialCategories = await repo.getCategories();
  console.log(`✓ Initial count: ${initialPrompts.length} prompts, ${initialCategories.length} categories`);
  assert(initialPrompts.length > 0, 'Initial prompts should not be empty on first boot');
  assert(initialCategories.length > 0, 'Initial categories should not be empty on first boot');
  const initialCount = initialPrompts.length;

  // --- STEP 2: CREATE PROMPT ---
  console.log('\n▶ [Test 2] Create New User Prompt');
  const testInput: CreatePromptInput = {
    title: 'Prompt Persistente de Teste',
    rawPrompt: 'Foto ultrarrealista de um astronauta em Marte com iluminação cinematográfica',
    targetModel: 'midjourney-v6',
    category: 'cat-cinematic',
    tags: ['Teste', 'Astronauta', 'Marte'],
    isFavorite: false,
    structured: {
      subject: 'Astronauta explorador',
      environment: 'Dunas de Marte ao pôr do sol',
      lighting: 'Luz dourada atmosférica',
      camera: '35mm anamórfico',
      composition: 'Plano médio',
      style: 'Cinemático sci-fi',
      colors: 'Laranja e azul escuro',
    },
  };

  const created = await repo.createPrompt(testInput);
  const createdId = created.id;
  console.log(`✓ Created Prompt ID: ${createdId}`);
  assert.strictEqual(created.title, testInput.title);
  assert.strictEqual(created.copyCount, 0);

  // --- STEP 3: RESTART 1 -> VERIFY CREATION PERSISTED ---
  console.log('\n▶ [Test 3] RESTART 1: Verify Created Prompt Persists Across Server Shutdown');
  // Simulate complete restart by discarding memory and re-instantiating repo
  repo = new FilePromptRepository(testDir);
  await repo.init();

  const recoveredPrompt = await repo.getPromptById(createdId);
  assert(recoveredPrompt !== null, 'Created prompt MUST survive restart');
  assert.strictEqual(recoveredPrompt?.id, createdId);
  assert.strictEqual(recoveredPrompt?.title, testInput.title);
  console.log(`✓ Confirmed: Prompt ${createdId} recovered after full restart!`);

  // --- STEP 4: UPDATE PROMPT & RESTART ---
  console.log('\n▶ [Test 4] Update Prompt & RESTART 2: Verify Edit Persists');
  const updated = await repo.updatePrompt(createdId, {
    title: 'Prompt Persistente de Teste (EDITADO)',
    notes: 'Nota adicionada com sucesso no teste.',
  });
  assert(updated !== null, 'Update should succeed');
  assert.strictEqual(updated.title, 'Prompt Persistente de Teste (EDITADO)');

  // Restart
  repo = new FilePromptRepository(testDir);
  await repo.init();
  const recoveredAfterEdit = await repo.getPromptById(createdId);
  assert.strictEqual(recoveredAfterEdit?.title, 'Prompt Persistente de Teste (EDITADO)');
  assert.strictEqual(recoveredAfterEdit?.notes, 'Nota adicionada com sucesso no teste.');
  console.log('✓ Confirmed: Prompt edits persisted after restart!');

  // --- STEP 5: FAVORITE & RESTART ---
  console.log('\n▶ [Test 5] Toggle Favorite & RESTART 3: Verify Favorite State Persists');
  const favResult = await repo.toggleFavorite(createdId);
  assert.strictEqual(favResult?.isFavorite, true);

  // Restart
  repo = new FilePromptRepository(testDir);
  await repo.init();
  const recoveredAfterFav = await repo.getPromptById(createdId);
  assert.strictEqual(recoveredAfterFav?.isFavorite, true);
  console.log('✓ Confirmed: Favorite state persisted after restart!');

  // --- STEP 6: ATOMIC COPY INCREMENT & RESTART ---
  console.log('\n▶ [Test 6] Atomic Increment Copy Count & RESTART 4: Verify Copy Count Persists');
  await repo.incrementCopyCount(createdId);
  await repo.incrementCopyCount(createdId);
  await repo.incrementCopyCount(createdId);

  // Restart
  repo = new FilePromptRepository(testDir);
  await repo.init();
  const recoveredAfterCopy = await repo.getPromptById(createdId);
  assert.strictEqual(recoveredAfterCopy?.copyCount, 3);
  console.log(`✓ Confirmed: copyCount=${recoveredAfterCopy?.copyCount} persisted after restart!`);

  // --- STEP 7: DUPLICATE PROMPT & RESTART ---
  console.log('\n▶ [Test 7] Duplicate Prompt & RESTART 5: Verify Duplicate Persists');
  const duplicated = await repo.duplicatePrompt(createdId);
  assert(duplicated !== null, 'Duplicate should succeed');
  const duplicateId = duplicated.id;
  assert(duplicateId !== createdId, 'Duplicate must have unique ID');

  // Restart
  repo = new FilePromptRepository(testDir);
  await repo.init();
  const recoveredDuplicate = await repo.getPromptById(duplicateId);
  assert(recoveredDuplicate !== null, 'Duplicated prompt must survive restart');
  assert.strictEqual(recoveredDuplicate?.title, 'Prompt Persistente de Teste (EDITADO) (Cópia)');
  console.log('✓ Confirmed: Duplicated prompt persisted after restart!');

  // --- STEP 8: CATEGORY CRUD & RESTART ---
  console.log('\n▶ [Test 8] Category CRUD & RESTART 6: Verify Categories Persist');
  const newCategory = await repo.createCategory({
    name: 'Categoria de Teste',
    slug: 'categoria-teste',
    icon: 'Sparkles',
    color: 'purple',
    description: 'Criada para teste de persistência',
  });
  const catId = newCategory.id;

  // Restart
  repo = new FilePromptRepository(testDir);
  await repo.init();
  const recoveredCat = await repo.getCategoryById(catId);
  assert(recoveredCat !== null, 'Category must survive restart');
  assert.strictEqual(recoveredCat?.name, 'Categoria de Teste');
  console.log('✓ Confirmed: Category persisted after restart!');

  // Delete Category & Restart
  const deleteCatResult = await repo.deleteCategory(catId);
  assert.strictEqual(deleteCatResult, true);
  repo = new FilePromptRepository(testDir);
  await repo.init();
  const recoveredDeletedCat = await repo.getCategoryById(catId);
  assert.strictEqual(recoveredDeletedCat, null, 'Deleted category must remain deleted after restart');
  console.log('✓ Confirmed: Deleted category remains deleted after restart!');

  // --- STEP 9: DELETE PROMPT & RESTART ---
  console.log('\n▶ [Test 9] Delete Prompt & RESTART 7: Verify Deletion Persists');
  const deletePromptResult = await repo.deletePrompt(createdId);
  assert.strictEqual(deletePromptResult, true);

  // Restart
  repo = new FilePromptRepository(testDir);
  await repo.init();
  const recoveredDeletedPrompt = await repo.getPromptById(createdId);
  assert.strictEqual(recoveredDeletedPrompt, null, 'Deleted prompt must remain deleted after restart');
  console.log('✓ Confirmed: Deleted prompt remains deleted after restart!');

  // --- STEP 10: MULTI-RESTART IDEMPOTENCE (Restarts 8, 9, 10) ---
  console.log('\n▶ [Test 10] Multiple Consecutive Restarts: Verify No Seed Duplication or Data Overwrite');
  const promptsBeforeMultiRestart = await repo.getPrompts();
  const countBefore = promptsBeforeMultiRestart.length;

  for (let i = 1; i <= 3; i++) {
    repo = new FilePromptRepository(testDir);
    await repo.init();
    const currentPrompts = await repo.getPrompts();
    assert.strictEqual(
      currentPrompts.length,
      countBefore,
      `Restart ${i} must not change prompt count or duplicate seeds (expected ${countBefore}, got ${currentPrompts.length})`
    );
  }
  console.log('✓ Confirmed: Multiple consecutive restarts maintain exact same records with zero seed duplications!');

  // Cleanup test directory
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  console.log('\n========================================');
  console.log('🎉 ALL PERSISTENCE TESTS PASSED (10/10)');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
