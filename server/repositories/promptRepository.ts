import { PromptItem, Category } from '../../src/types';

export interface PromptQuery {
  search?: string;
  category?: string;
  model?: string;
  tag?: string;
  onlyFavorites?: boolean;
  sortBy?: string;
}

export type CreatePromptInput = Omit<PromptItem, 'id' | 'createdAt' | 'updatedAt' | 'copyCount'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  copyCount?: number;
};

export type UpdatePromptInput = Partial<PromptItem>;

export interface PromptRepository {
  init(): Promise<void>;
  
  // Prompts
  getPrompts(query?: PromptQuery): Promise<PromptItem[]>;
  getPromptById(id: string): Promise<PromptItem | null>;
  createPrompt(input: CreatePromptInput): Promise<PromptItem>;
  updatePrompt(id: string, updates: UpdatePromptInput): Promise<PromptItem | null>;
  deletePrompt(id: string): Promise<boolean>;
  toggleFavorite(id: string): Promise<PromptItem | null>;
  incrementCopyCount(id: string): Promise<PromptItem | null>;
  duplicatePrompt(id: string): Promise<PromptItem | null>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  createCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category | null>;
  deleteCategory(id: string): Promise<boolean>;

  // Seed & Reset
  seedIfEmpty(): Promise<{ promptsSeeded: number; categoriesSeeded: number }>;
  resetToDefaults(): Promise<void>;
}
