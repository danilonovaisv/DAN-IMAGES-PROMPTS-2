import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { PromptItem, Category } from '../../src/types';
import { INITIAL_PROMPTS } from '../../src/data/initialPrompts';
import { DEFAULT_CATEGORIES } from '../../src/data/defaultCategories';
import { PromptRepository, PromptQuery, CreatePromptInput, UpdatePromptInput } from './promptRepository';

export class FilePromptRepository implements PromptRepository {
  private dataDir: string;
  private promptsFile: string;
  private categoriesFile: string;
  private metadataFile: string;
  private prompts: PromptItem[] = [];
  private categories: Category[] = [];
  private initialized = false;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(process.cwd(), 'data');
    this.promptsFile = path.join(this.dataDir, 'prompts.json');
    this.categoriesFile = path.join(this.dataDir, 'categories.json');
    this.metadataFile = path.join(this.dataDir, 'metadata.json');

    if (!fsSync.existsSync(this.dataDir)) {
      fsSync.mkdirSync(this.dataDir, { recursive: true });
    }
    console.log(`[persistence] provider initialized: Local Filesystem (${this.dataDir})`);
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    let hasPrompts = false;
    let hasCategories = false;

    try {
      if (fsSync.existsSync(this.promptsFile)) {
        const raw = await fs.readFile(this.promptsFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.prompts = parsed;
          hasPrompts = true;
        }
      }
    } catch (err) {
      console.warn('[persistence] Warning reading prompts.json:', err);
    }

    try {
      if (fsSync.existsSync(this.categoriesFile)) {
        const raw = await fs.readFile(this.categoriesFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categories = parsed;
          hasCategories = true;
        }
      }
    } catch (err) {
      console.warn('[persistence] Warning reading categories.json:', err);
    }

    if (!hasPrompts || !hasCategories) {
      await this.seedIfEmpty();
    } else {
      console.log(`[persistence] loaded ${this.prompts.length} prompts and ${this.categories.length} categories from disk`);
    }

    this.initialized = true;
  }

  public async seedIfEmpty(): Promise<{ promptsSeeded: number; categoriesSeeded: number }> {
    let promptsSeeded = 0;
    let categoriesSeeded = 0;

    if (this.prompts.length === 0) {
      this.prompts = [...INITIAL_PROMPTS];
      await this.savePrompts();
      promptsSeeded = this.prompts.length;
    }

    if (this.categories.length === 0) {
      this.categories = [...DEFAULT_CATEGORIES];
      await this.saveCategories();
      categoriesSeeded = this.categories.length;
    }

    const metadata = {
      initialized: true,
      initializedAt: new Date().toISOString(),
    };
    await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`[persistence] seed completed: ${promptsSeeded} prompts, ${categoriesSeeded} categories`);

    return { promptsSeeded, categoriesSeeded };
  }

  private async savePrompts(): Promise<void> {
    const tempFile = `${this.promptsFile}.tmp.${Date.now()}`;
    await fs.writeFile(tempFile, JSON.stringify(this.prompts, null, 2), 'utf-8');
    await fs.rename(tempFile, this.promptsFile);
  }

  private async saveCategories(): Promise<void> {
    const tempFile = `${this.categoriesFile}.tmp.${Date.now()}`;
    await fs.writeFile(tempFile, JSON.stringify(this.categories, null, 2), 'utf-8');
    await fs.rename(tempFile, this.categoriesFile);
  }

  public async getPrompts(query?: PromptQuery): Promise<PromptItem[]> {
    let result = [...this.prompts];

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
          (p.tags && p.tags.some(t => t.toLowerCase() === tagLowerSearch(t, term))) ||
          (p.structured?.subject && p.structured.subject.toLowerCase().includes(term)) ||
          (p.structured?.style && p.structured.style.toLowerCase().includes(term)) ||
          (p.structured?.environment && p.structured.environment.toLowerCase().includes(term))
        );
      });
    }

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
    const prompt = this.prompts.find(p => p.id === id);
    return prompt || null;
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

    this.prompts.unshift(newPrompt);
    await this.savePrompts();
    return newPrompt;
  }

  public async updatePrompt(id: string, updates: UpdatePromptInput): Promise<PromptItem | null> {
    const index = this.prompts.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = this.prompts[index];
    const updated: PromptItem = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.prompts[index] = updated;
    await this.savePrompts();
    return updated;
  }

  public async deletePrompt(id: string): Promise<boolean> {
    const initialLen = this.prompts.length;
    this.prompts = this.prompts.filter(p => p.id !== id);
    if (this.prompts.length !== initialLen) {
      await this.savePrompts();
      return true;
    }
    return false;
  }

  public async toggleFavorite(id: string): Promise<PromptItem | null> {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return null;

    prompt.isFavorite = !prompt.isFavorite;
    prompt.updatedAt = new Date().toISOString();
    await this.savePrompts();
    return prompt;
  }

  public async incrementCopyCount(id: string): Promise<PromptItem | null> {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return null;

    prompt.copyCount = (prompt.copyCount || 0) + 1;
    prompt.updatedAt = new Date().toISOString();
    await this.savePrompts();
    return prompt;
  }

  public async duplicatePrompt(id: string): Promise<PromptItem | null> {
    const original = this.prompts.find(p => p.id === id);
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

    this.prompts.unshift(duplicated);
    await this.savePrompts();
    return duplicated;
  }

  public async getCategories(): Promise<Category[]> {
    return [...this.categories];
  }

  public async getCategoryById(id: string): Promise<Category | null> {
    return this.categories.find(c => c.id === id) || null;
  }

  public async createCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
    const newCat: Category = {
      ...category,
      id: category.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isDefault: category.isDefault ?? false,
    };
    this.categories.push(newCat);
    await this.saveCategories();
    return newCat;
  }

  public async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.categories[index] = { ...this.categories[index], ...updates, id };
    await this.saveCategories();
    return this.categories[index];
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const cat = this.categories.find(c => c.id === id);
    if (!cat || cat.isDefault) return false;

    this.categories = this.categories.filter(c => c.id !== id);
    await this.saveCategories();
    return true;
  }

  public async resetToDefaults(): Promise<void> {
    this.prompts = [...INITIAL_PROMPTS];
    this.categories = [...DEFAULT_CATEGORIES];
    await this.savePrompts();
    await this.saveCategories();
    const metadata = {
      initialized: true,
      initializedAt: new Date().toISOString(),
      resetAt: new Date().toISOString(),
    };
    await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log('[persistence] Reset local file database to defaults.');
  }
}

function tagLowerSearch(tag: string, term: string): string {
  return tag.toLowerCase().includes(term) ? term : '';
}
