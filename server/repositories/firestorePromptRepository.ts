import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  writeBatch,
  increment,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { PromptItem, Category } from '../../src/types/index.js';
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

    let apiKey = process.env.FIREBASE_API_KEY;

    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!projectId || projectId === 'projeto-agents-503014') {
          projectId = parsed.projectId || projectId;
        }
        if (parsed.firestoreDatabaseId) {
          // If env has invalid/typo ID 'portfolio-danilo-novais' or is empty, prefer the authoritative provisioned database ID
          if (!databaseId || databaseId === 'portfolio-danilo-novais') {
            databaseId = parsed.firestoreDatabaseId;
          }
        }
        if (parsed.apiKey && !apiKey) {
          apiKey = parsed.apiKey;
        }
      }
    } catch (err) {
      console.warn('[persistence] Failed to read firebase-applet-config.json:', err);
    }

    if (!projectId) {
      projectId = 'projeto-agents-503014';
    }

    const appName = 'prompt-persistence-app';
    let app: FirebaseApp;
    try {
      app = getApp(appName);
    } catch {
      app = initializeApp(
        {
          projectId,
          apiKey: apiKey || 'AIzaSyDHLQ4MHwh_KU1ahvPcstxT11xouYtZMXg',
        },
        appName
      );
    }

    this.db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    console.log(`[persistence] provider initialized: Firestore (Project ID: ${projectId}, Database: ${databaseId || '(default)'})`);
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    await this.seedIfEmpty();
    this.initialized = true;
  }

  public async seedIfEmpty(): Promise<{ promptsSeeded: number; categoriesSeeded: number }> {
    try {
      const metaRef = doc(this.db, '_metadata', 'system');
      const metaSnap = await getDoc(metaRef);

      if (metaSnap.exists() && (metaSnap.data() as any)?.initialized) {
        console.log('[persistence] seed skipped: database already initialized');
        return { promptsSeeded: 0, categoriesSeeded: 0 };
      }

      // Check if collections already have data
      const promptsSnap = await getDocs(collection(this.db, 'prompts'));
      const categoriesSnap = await getDocs(collection(this.db, 'categories'));

      if (!promptsSnap.empty && !categoriesSnap.empty) {
        await setDoc(metaRef, { initialized: true, initializedAt: new Date().toISOString() }, { merge: true });
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

      const batch = writeBatch(this.db);

      if (promptsSnap.empty) {
        for (const prompt of seedPrompts) {
          const cleanPrompt = Object.fromEntries(Object.entries(prompt).filter(([_, v]) => v !== undefined));
          batch.set(doc(this.db, 'prompts', prompt.id), cleanPrompt);
        }
      }

      if (categoriesSnap.empty) {
        for (const category of seedCategories) {
          const cleanCategory = Object.fromEntries(Object.entries(category).filter(([_, v]) => v !== undefined));
          batch.set(doc(this.db, 'categories', category.id), cleanCategory);
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
        promptsSeeded: promptsSnap.empty ? seedPrompts.length : 0,
        categoriesSeeded: categoriesSnap.empty ? seedCategories.length : 0,
      };
    } catch (err: any) {
      console.warn('[persistence] Firestore seed/migration check encountered error:', err?.message || err);
      throw err;
    }
  }

  public async getPrompts(query?: PromptQuery): Promise<PromptItem[]> {
    const snapshot = await getDocs(collection(this.db, 'prompts'));
    let result: PromptItem[] = [];

    snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      result.push(docSnap.data() as PromptItem);
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
    const docSnap = await getDoc(doc(this.db, 'prompts', id));
    if (!docSnap.exists()) return null;
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

    const cleanPrompt = Object.fromEntries(Object.entries(newPrompt).filter(([_, v]) => v !== undefined));
    await setDoc(doc(this.db, 'prompts', id), cleanPrompt);
    return newPrompt;
  }

  public async updatePrompt(id: string, updates: UpdatePromptInput): Promise<PromptItem | null> {
    const docRef = doc(this.db, 'prompts', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const existing = snap.data() as PromptItem;
    const updated: PromptItem = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const cleanUpdated = Object.fromEntries(Object.entries(updated).filter(([_, v]) => v !== undefined));
    await setDoc(docRef, cleanUpdated, { merge: true });
    return updated;
  }

  public async deletePrompt(id: string): Promise<boolean> {
    const docRef = doc(this.db, 'prompts', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;

    await deleteDoc(docRef);
    return true;
  }

  public async toggleFavorite(id: string): Promise<PromptItem | null> {
    const docRef = doc(this.db, 'prompts', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data() as PromptItem;
    const isFavorite = !data.isFavorite;
    const updatedAt = new Date().toISOString();

    await updateDoc(docRef, { isFavorite, updatedAt });
    return { ...data, isFavorite, updatedAt };
  }

  public async incrementCopyCount(id: string): Promise<PromptItem | null> {
    const docRef = doc(this.db, 'prompts', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data() as PromptItem;
    const copyCount = (data.copyCount || 0) + 1;
    const updatedAt = new Date().toISOString();

    await updateDoc(docRef, {
      copyCount: increment(1),
      updatedAt,
    });

    return { ...data, copyCount, updatedAt };
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

    const cleanDuplicated = Object.fromEntries(Object.entries(duplicated).filter(([_, v]) => v !== undefined));
    await setDoc(doc(this.db, 'prompts', duplicated.id), cleanDuplicated);
    return duplicated;
  }

  public async getCategories(): Promise<Category[]> {
    const snapshot = await getDocs(collection(this.db, 'categories'));
    const result: Category[] = [];
    snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      result.push(docSnap.data() as Category);
    });
    return result;
  }

  public async getCategoryById(id: string): Promise<Category | null> {
    const snap = await getDoc(doc(this.db, 'categories', id));
    if (!snap.exists()) return null;
    return snap.data() as Category;
  }

  public async createCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
    const id = category.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newCat: Category = {
      ...category,
      id,
      isDefault: category.isDefault ?? false,
    };
    const cleanCat = Object.fromEntries(Object.entries(newCat).filter(([_, v]) => v !== undefined));
    await setDoc(doc(this.db, 'categories', id), cleanCat);
    return newCat;
  }

  public async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const docRef = doc(this.db, 'categories', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const existing = snap.data() as Category;
    const updated: Category = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    const cleanUpdated = Object.fromEntries(Object.entries(updated).filter(([_, v]) => v !== undefined));
    await setDoc(docRef, cleanUpdated, { merge: true });
    return updated;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const docRef = doc(this.db, 'categories', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;

    const cat = snap.data() as Category;
    if (cat.isDefault) return false;

    await deleteDoc(docRef);
    return true;
  }

  public async resetToDefaults(): Promise<void> {
    console.log('[persistence] Resetting database to defaults...');

    const promptsSnap = await getDocs(collection(this.db, 'prompts'));
    const categoriesSnap = await getDocs(collection(this.db, 'categories'));

    const batch = writeBatch(this.db);

    promptsSnap.forEach((d: QueryDocumentSnapshot<DocumentData>) => batch.delete(d.ref));
    categoriesSnap.forEach((d: QueryDocumentSnapshot<DocumentData>) => batch.delete(d.ref));

    for (const p of INITIAL_PROMPTS) {
      const cleanPrompt = Object.fromEntries(Object.entries(p).filter(([_, v]) => v !== undefined));
      batch.set(doc(this.db, 'prompts', p.id), cleanPrompt);
    }
    for (const c of DEFAULT_CATEGORIES) {
      const cleanCat = Object.fromEntries(Object.entries(c).filter(([_, v]) => v !== undefined));
      batch.set(doc(this.db, 'categories', c.id), cleanCat);
    }

    const metaRef = doc(this.db, '_metadata', 'system');
    batch.set(metaRef, {
      initialized: true,
      initializedAt: new Date().toISOString(),
      resetAt: new Date().toISOString(),
    });

    await batch.commit();
    console.log('[persistence] Database successfully reset to defaults.');
  }
}

