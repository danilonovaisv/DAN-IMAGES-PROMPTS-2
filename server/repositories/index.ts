import { PromptRepository } from './promptRepository';
import { FirestorePromptRepository } from './firestorePromptRepository';
import { FilePromptRepository } from './filePromptRepository';

let repositoryInstance: PromptRepository | null = null;

export async function getPromptRepository(): Promise<PromptRepository> {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  const provider = (process.env.PERSISTENCE_PROVIDER || 'filesystem').toLowerCase().trim();

  if (provider === 'firestore') {
    try {
      const firestoreRepo = new FirestorePromptRepository();
      await firestoreRepo.init();
      repositoryInstance = firestoreRepo;
      return repositoryInstance;
    } catch (err: any) {
      console.warn('[persistence] Firestore initialization failed, falling back to FilePromptRepository for persistence:', err.message || err);
    }
  }

  // Local filesystem persistence (reliable for local & standalone instances)
  const fileRepo = new FilePromptRepository(process.env.DATA_DIR);
  await fileRepo.init();
  repositoryInstance = fileRepo;
  return repositoryInstance;
}

export * from './promptRepository';
export * from './firestorePromptRepository';
export * from './filePromptRepository';
