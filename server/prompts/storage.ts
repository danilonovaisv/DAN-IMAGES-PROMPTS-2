import fs from 'fs';
import path from 'path';
import { PromptItem, Category } from '../../src/types';
import { INITIAL_PROMPTS } from '../../src/data/initialPrompts';
import { DEFAULT_CATEGORIES } from '../../src/data/defaultCategories';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class PromptStore {
  private prompts: PromptItem[] = [];
  private categories: Category[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(PROMPTS_FILE)) {
        const data = fs.readFileSync(PROMPTS_FILE, 'utf-8');
        this.prompts = JSON.parse(data);
      } else {
        this.prompts = [...INITIAL_PROMPTS];
        this.savePrompts();
      }
    } catch (err) {
      console.error('Erro ao ler prompts.json, usando dados iniciais:', err);
      this.prompts = [...INITIAL_PROMPTS];
    }

    try {
      if (fs.existsSync(CATEGORIES_FILE)) {
        const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
        this.categories = JSON.parse(data);
      } else {
        this.categories = [...DEFAULT_CATEGORIES];
        this.saveCategories();
      }
    } catch (err) {
      console.error('Erro ao ler categories.json, usando dados iniciais:', err);
      this.categories = [...DEFAULT_CATEGORIES];
    }
  }

  private savePrompts() {
    try {
      fs.writeFileSync(PROMPTS_FILE, JSON.stringify(this.prompts, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erro ao salvar prompts.json:', err);
    }
  }

  private saveCategories() {
    try {
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(this.categories, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erro ao salvar categories.json:', err);
    }
  }

  public getPrompts(query?: {
    search?: string;
    category?: string;
    model?: string;
    tag?: string;
    onlyFavorites?: boolean;
    sortBy?: string;
  }): PromptItem[] {
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
      result = result.filter(p => p.tags.some(t => t.toLowerCase() === tagLower));
    }

    if (query?.search && query.search.trim()) {
      const term = query.search.toLowerCase().trim();
      result = result.filter(p => {
        return (
          p.title.toLowerCase().includes(term) ||
          p.rawPrompt.toLowerCase().includes(term) ||
          p.tags.some(t => t.toLowerCase().includes(term)) ||
          p.structured.subject.toLowerCase().includes(term) ||
          p.structured.style.toLowerCase().includes(term) ||
          p.structured.environment.toLowerCase().includes(term)
        );
      });
    }

    // Sorting
    switch (query?.sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
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

  public getPromptById(id: string): PromptItem | undefined {
    return this.prompts.find(p => p.id === id);
  }

  public createPrompt(item: Omit<PromptItem, 'id' | 'createdAt' | 'updatedAt' | 'copyCount'>): PromptItem {
    const now = new Date().toISOString();
    const newPrompt: PromptItem = {
      ...item,
      id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      copyCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.prompts.unshift(newPrompt);
    this.savePrompts();
    return newPrompt;
  }

  public updatePrompt(id: string, updates: Partial<PromptItem>): PromptItem | null {
    const index = this.prompts.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = this.prompts[index];
    const updated: PromptItem = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      createdAt: existing.createdAt, // Immutable creation timestamp
      updatedAt: new Date().toISOString(),
    };

    this.prompts[index] = updated;
    this.savePrompts();
    return updated;
  }

  public deletePrompt(id: string): boolean {
    const initialLen = this.prompts.length;
    this.prompts = this.prompts.filter(p => p.id !== id);
    if (this.prompts.length !== initialLen) {
      this.savePrompts();
      return true;
    }
    return false;
  }

  public toggleFavorite(id: string): PromptItem | null {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return null;
    prompt.isFavorite = !prompt.isFavorite;
    prompt.updatedAt = new Date().toISOString();
    this.savePrompts();
    return prompt;
  }

  public incrementCopyCount(id: string): PromptItem | null {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return null;
    prompt.copyCount = (prompt.copyCount || 0) + 1;
    this.savePrompts();
    return prompt;
  }

  public duplicatePrompt(id: string): PromptItem | null {
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
    this.savePrompts();
    return duplicated;
  }

  // Categories
  public getCategories(): Category[] {
    return [...this.categories];
  }

  public createCategory(category: Omit<Category, 'id'>): Category {
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isDefault: false,
    };
    this.categories.push(newCat);
    this.saveCategories();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>): Category | null {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.categories[index] = { ...this.categories[index], ...updates, id };
    this.saveCategories();
    return this.categories[index];
  }

  public deleteCategory(id: string): boolean {
    const cat = this.categories.find(c => c.id === id);
    if (!cat || cat.isDefault) return false;
    this.categories = this.categories.filter(c => c.id !== id);
    this.saveCategories();
    return true;
  }

  public resetToDefaults() {
    this.prompts = [...INITIAL_PROMPTS];
    this.categories = [...DEFAULT_CATEGORIES];
    this.savePrompts();
    this.saveCategories();
  }
}

export const promptStore = new PromptStore();
