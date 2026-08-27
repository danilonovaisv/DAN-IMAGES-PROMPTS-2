import fs from 'fs';
import path from 'path';
import { PromptItem, Category } from '../../src/types';
import { getPromptRepository, PromptRepository, PromptQuery, CreatePromptInput, UpdatePromptInput } from '../repositories';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Storage adapter providing backwards compatibility
 */
export class PromptStore {
  private getRepo(): Promise<PromptRepository> {
    return getPromptRepository();
  }

  public async getPrompts(query?: PromptQuery): Promise<PromptItem[]> {
    const repo = await this.getRepo();
    return repo.getPrompts(query);
  }

  public async getPromptById(id: string): Promise<PromptItem | null> {
    const repo = await this.getRepo();
    return repo.getPromptById(id);
  }

  public async createPrompt(item: CreatePromptInput): Promise<PromptItem> {
    const repo = await this.getRepo();
    return repo.createPrompt(item);
  }

  public async updatePrompt(id: string, updates: UpdatePromptInput): Promise<PromptItem | null> {
    const repo = await this.getRepo();
    return repo.updatePrompt(id, updates);
  }

  public async deletePrompt(id: string): Promise<boolean> {
    const repo = await this.getRepo();
    return repo.deletePrompt(id);
  }

  public async toggleFavorite(id: string): Promise<PromptItem | null> {
    const repo = await this.getRepo();
    return repo.toggleFavorite(id);
  }

  public async incrementCopyCount(id: string): Promise<PromptItem | null> {
    const repo = await this.getRepo();
    return repo.incrementCopyCount(id);
  }

  public async duplicatePrompt(id: string): Promise<PromptItem | null> {
    const repo = await this.getRepo();
    return repo.duplicatePrompt(id);
  }

  public async getCategories(): Promise<Category[]> {
    const repo = await this.getRepo();
    return repo.getCategories();
  }

  public async getCategoryById(id: string): Promise<Category | null> {
    const repo = await this.getRepo();
    return repo.getCategoryById(id);
  }

  public async createCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
    const repo = await this.getRepo();
    return repo.createCategory(category);
  }

  public async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const repo = await this.getRepo();
    return repo.updateCategory(id, updates);
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const repo = await this.getRepo();
    return repo.deleteCategory(id);
  }

  public async resetToDefaults(): Promise<void> {
    const repo = await this.getRepo();
    return repo.resetToDefaults();
  }
}

export const promptStore = new PromptStore();
