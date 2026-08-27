import { PromptRepository } from './promptRepository';
import { FirestorePromptRepository } from './firestorePromptRepository';
import { FilePromptRepository } from './filePromptRepository';

let repositoryInstance: PromptRepository | null = null;

export async function getPromptRepository(): Promise<PromptRepository> {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  const provider = (process.env.PERSISTENCE_PROVIDER || '').toLowerCase().trim();

  if (provider === 'filesystem') {
    console.log('[persistence] Explicit PERSISTENCE_PROVIDER=filesystem requested.');
    repositoryInstance = new FilePromptRepository(process.env.DATA_DIR);
    await repositoryInstance.init();
    return repositoryInstance;
  }

  try {
    const firestoreRepo = new FirestorePromptRepository();
    await firestoreRepo.init();
    repositoryInstance = firestoreRepo;
    return repositoryInstance;
  } catch (err: any) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[persistence] CRITICAL: Failed to initialize Firestore repository in production environment:', err);
      throw new Error(`Persistence initialization failure: ${err.message || err}`);
    }

    console.warn('[persistence] Firestore initialization failed in non-production mode, falling back to FilePromptRepository for offline development:', err.message || err);
    const fileRepo = new FilePromptRepository(process.env.DATA_DIR);
    await fileRepo.init();
    repositoryInstance = fileRepo;
    return repositoryInstance;
  }
}

export * from './promptRepository';
export * from './firestorePromptRepository';
export * from './filePromptRepository';
