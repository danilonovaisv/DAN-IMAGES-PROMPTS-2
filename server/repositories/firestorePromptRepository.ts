import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue, QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { PromptItem, Category } from '../../src/types';
import { INITIAL_PROMPTS } from '../../src/data/initialPrompts';
import { DEFAULT_CATEGORIES } from '../../src/data/defaultCategories';
import { PromptRepository, PromptQuery, CreatePromptInput, UpdatePromptInput } from './promptRepository';

export class FirestorePromptRepository implements PromptRepository {
  private db: Firestore;
  private initialized = false;

  constructor() {
    let projectId =
      process.env.GCP_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID;

    let databaseId =
      process.env.FIRESTORE_DATABASE_ID ||
      process.env.FIREBASE_DATABASE_ID;

    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!projectId && parsed.projectId) {
          projectId = parsed.projectId;
        }
        if (!databaseId && parsed.firestoreDatabaseId) {
          databaseId = parsed.firestoreDatabaseId;
        }
      }
    } catch (err) {
      console.warn('[persistence] Failed to read firebase-applet-config.json:', err);
    }

    if (!projectId) {
      projectId = 'projeto-agents-503014';
    }

    const app = getApps().length === 0
      ? initializeApp({ projectId })
      : getApps()[0];

    this.db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    this.db.settings({ ignoreUndefinedProperties: true });
    console.log(`[persistence] provider initialized: Firestore (Project ID: ${projectId}, Database: ${databaseId || '(default)'})`);
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    await this.seedIfEmpty();
    this.initialized = true;
  }

  public async seedIfEmpty(): Promise<{ promptsSeeded: number; categoriesSeeded: number }> {
    try {
      const metaRef = this.db.collection('_metadata').doc('system');
      const metaSnap = await metaRef.get();

      if (metaSnap.exists && metaSnap.data()?.initialized) {
        console.log('[persistence] seed skipped: database already initialized');
        return { promptsSeeded: 0, categoriesSeeded: 0 };
      }

      // Check if collections already have data
      const promptsCountSnap = await this.db.collection('prompts').limit(1).get();
      const categoriesCountSnap = await this.db.collection('categories').limit(1).get();

      if (!promptsCountSnap.empty && !categoriesCountSnap.empty) {
        await metaRef.set({ initialized: true, initializedAt: new Date().toISOString() }, { merge: true });
        console.log('[persistence] seed skipped: existing collections found');
        return { promptsSeeded: 0, categoriesSeeded: 0 };
      }

      console.log('[persistence] initializing and seeding database...');

      // Check for existing json data to migrate first
      let seedPrompts = [...INITIAL_PROMPTS];
      let seedCategories = [...DEFAULT_CATEGORIES];

      const localPromptsFile = path.join(process.cwd(), 'data', 'prompts.json');
      const localCategoriesFile = path.join(process.cwd(), 'data', 'categories.json');

      try {
        if (fs.existsSync(localPromptsFile)) {
          const raw = fs.readFileSync(localPromptsFile, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            seedPrompts = parsed;
          }
        }
      } catch (err) {
        console.warn('[persistence] Could not read local prompts.json for migration:', err);
      }

      try {
        if (fs.existsSync(localCategoriesFile)) {
          const raw = fs.readFileSync(localCategoriesFile, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            seedCategories = parsed;
          }
        }
      } catch (err) {
        console.warn('[persistence] Could not read local categories.json for migration:', err);
      }

      const batch = this.db.batch();

      if (promptsCountSnap.empty) {
        for (const prompt of seedPrompts) {
          const docRef = this.db.collection('prompts').doc(prompt.id);
          batch.set(docRef, prompt);
        }
      }

      if (categoriesCountSnap.empty) {
        for (const category of seedCategories) {
          const docRef = this.db.collection('categories').doc(category.id);
          batch.set(docRef, category);
        }
      }

      batch.set(metaRef, {
        initialized: true,
        initializedAt: new Date().toISOString(),
        migratedFromLocalJson: true,
      });

      await batch.commit();
      console.log(`[persistence] migration completed: ${seedPrompts.length} prompts, ${seedCategories.length} categories`);

      return {
        promptsSeeded: promptsCountSnap.empty ? seedPrompts.length : 0,
        categoriesSeeded: categoriesCountSnap.empty ? seedCategories.length : 0,
      };
    } catch (err: any) {
      console.warn('[persistence] Firestore seed/migration check encountered error:', err?.message || err);
      throw err;
    }
  }

  public async getPrompts(query?: PromptQuery): Promise<PromptItem[]> {
    const snapshot = await this.db.collection('prompts').get();
    let result: PromptItem[] = [];

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      result.push(doc.data() as PromptItem);
    });

    if (query?.onlyFavorites) {
      result = result.filter(p => p.isFavorite);
    }

    if (query?.category && query.category !== 'all') {
      result = result.filter(p => p.category === query.category);
    }

    if (query?.model && query.model !== 'all') {
      result = result.filter(p => p.targetModel === query.model);
    }

    if (query?.tag) {
      const tagLower = query.tag.toLowerCase();
      result = result.filter(p => p.tags && p.tags.some(t => t.toLowerCase() === tagLower));
    }

    if (query?.search && query.search.trim()) {
      const term = query.search.toLowerCase().trim();
      result = result.filter(p => {
        return (
          (p.title && p.title.toLowerCase().includes(term)) ||
          (p.rawPrompt && p.rawPrompt.toLowerCase().includes(term)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(term))) ||
          (p.structured?.subject && p.structured.subject.toLowerCase().includes(term)) ||
          (p.structured?.style && p.structured.style.toLowerCase().includes(term)) ||
          (p.structured?.environment && p.structured.environment.toLowerCase().includes(term))
        );
      });
    }

    // Sorting
    switch (query?.sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'az':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'copies':
        result.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
        break;
      case 'favorites':
        result.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }

  public async getPromptById(id: string): Promise<PromptItem | null> {
    const docSnap = await this.db.collection('prompts').doc(id).get();
    if (!docSnap.exists) return null;
    return docSnap.data() as PromptItem;
  }

  public async createPrompt(input: CreatePromptInput): Promise<PromptItem> {
    const now = new Date().toISOString();
    const id = input.id || `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newPrompt: PromptItem = {
      ...input,
      id,
      copyCount: input.copyCount ?? 0,
      isFavorite: input.isFavorite ?? false,
      createdAt: input.createdAt || now,
      updatedAt: input.updatedAt || now,
    };

    await this.db.collection('prompts').doc(id).set(newPrompt);
    return newPrompt;
  }

  public async updatePrompt(id: string, updates: UpdatePromptInput): Promise<PromptItem | null> {
    const docRef = this.db.collection('prompts').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const existing = snap.data() as PromptItem;
    const updated: PromptItem = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updated, { merge: true });
    return updated;
  }

  public async deletePrompt(id: string): Promise<boolean> {
    const docRef = this.db.collection('prompts').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return false;

    await docRef.delete();
    return true;
  }

  public async toggleFavorite(id: string): Promise<PromptItem | null> {
    const docRef = this.db.collection('prompts').doc(id);
    return await this.db.runTransaction(async (transaction: Transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return null;

      const data = snap.data() as PromptItem;
      const isFavorite = !data.isFavorite;
      const updatedAt = new Date().toISOString();

      transaction.update(docRef, { isFavorite, updatedAt });
      return { ...data, isFavorite, updatedAt };
    });
  }

  public async incrementCopyCount(id: string): Promise<PromptItem | null> {
    const docRef = this.db.collection('prompts').doc(id);
    return await this.db.runTransaction(async (transaction: Transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return null;

      const data = snap.data() as PromptItem;
      const copyCount = (data.copyCount || 0) + 1;
      const updatedAt = new Date().toISOString();

      transaction.update(docRef, {
        copyCount: FieldValue.increment(1),
        updatedAt,
      });

      return { ...data, copyCount, updatedAt };
    });
  }

  public async duplicatePrompt(id: string): Promise<PromptItem | null> {
    const original = await this.getPromptById(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const duplicated: PromptItem = {
      ...original,
      id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${original.title} (Cópia)`,
      copyCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.collection('prompts').doc(duplicated.id).set(duplicated);
    return duplicated;
  }

  public async getCategories(): Promise<Category[]> {
    const snapshot = await this.db.collection('categories').get();
    const result: Category[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      result.push(doc.data() as Category);
    });
    return result;
  }

  public async getCategoryById(id: string): Promise<Category | null> {
    const snap = await this.db.collection('categories').doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as Category;
  }

  public async createCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
    const id = category.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newCat: Category = {
      ...category,
      id,
      isDefault: category.isDefault ?? false,
    };
    await this.db.collection('categories').doc(id).set(newCat);
    return newCat;
  }

  public async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const docRef = this.db.collection('categories').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const existing = snap.data() as Category;
    const updated: Category = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    await docRef.set(updated, { merge: true });
    return updated;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const docRef = this.db.collection('categories').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return false;

    const cat = snap.data() as Category;
    if (cat.isDefault) return false;

    await docRef.delete();
    return true;
  }

  public async resetToDefaults(): Promise<void> {
    console.log('[persistence] Resetting database to defaults...');
    
    // Batch delete existing prompts
    const promptsSnap = await this.db.collection('prompts').get();
    const categoriesSnap = await this.db.collection('categories').get();

    const batch = this.db.batch();

    promptsSnap.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
    categoriesSnap.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));

    for (const p of INITIAL_PROMPTS) {
      batch.set(this.db.collection('prompts').doc(p.id), p);
    }
    for (const c of DEFAULT_CATEGORIES) {
      batch.set(this.db.collection('categories').doc(c.id), c);
    }

    const metaRef = this.db.collection('_metadata').doc('system');
    batch.set(metaRef, {
      initialized: true,
      initializedAt: new Date().toISOString(),
      resetAt: new Date().toISOString(),
    });

    await batch.commit();
    console.log('[persistence] Database successfully reset to defaults.');
  }
}
