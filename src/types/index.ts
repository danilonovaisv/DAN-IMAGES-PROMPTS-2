export interface AIModel {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  badgeColor: string;
  supportsNegativePrompt: boolean;
  supportsParams: boolean;
  placeholderPrompt: string;
}

export interface PromptParameters {
  aspectRatio?: string;
  stylize?: string | number;
  chaos?: string | number;
  seed?: string | number;
  negativePrompt?: string;
  cfgScale?: string | number;
  sampler?: string;
  rawParams?: string;
}

export interface StructuredPromptData {
  subject: string;
  environment: string;
  lighting: string;
  camera: string;
  composition: string;
  style: string;
  colors: string;
  instructions?: string;
  parameters?: PromptParameters;
}

export interface ImageReference {
  url: string;
  storageType: 'local' | 'external' | 'sample';
  aspectRatio?: string;
  alt?: string;
}

export interface PromptItem {
  id: string;
  title: string;
  rawPrompt: string;
  targetModel: string;
  category: string;
  tags: string[];
  image?: ImageReference;
  structured: StructuredPromptData;
  isFavorite: boolean;
  copyCount: number;
  notes?: string;
  userId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  isDefault?: boolean;
  isSystem?: boolean;
}

export type ViewMode = 'grid' | 'compact' | 'table';
export type SortOption = 'newest' | 'oldest' | 'az' | 'copies' | 'favorites';

export interface FilterState {
  search: string;
  category: string;
  model: string;
  tag?: string;
  onlyFavorites: boolean;
  sortBy: SortOption;
  viewMode: ViewMode;
}

export interface PromptAnalysisRequest {
  rawPrompt: string;
  targetModel?: string;
  category?: string;
  imageBase64?: string;
  imageMimeType?: string;
  imageUrl?: string;
}

export interface PromptAnalysisResponse {
  title: string;
  suggestedCategory: string;
  tags: string[];
  structured: StructuredPromptData;
  formattedPrompt: string;
  analysisNotes?: string;
}
