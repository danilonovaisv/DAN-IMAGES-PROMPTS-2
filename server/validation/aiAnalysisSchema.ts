export interface ValidatedAnalysisResult {
  title: string;
  suggestedCategory: string;
  tags: string[];
  structured: {
    subject: string;
    environment: string;
    lighting: string;
    camera: string;
    composition: string;
    style: string;
    colors: string;
    instructions: string;
    parameters: {
      aspectRatio?: string;
      rawParams?: string;
      negativePrompt?: string;
      stylize?: number;
      cfgScale?: number;
    };
  };
  formattedPrompt: string;
  analysisNotes: string;
}

export function validateAIAnalysisOutput(data: unknown): ValidatedAnalysisResult | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, any>;

  if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
    return null;
  }

  const tags = Array.isArray(obj.tags)
    ? obj.tags.filter((t: any) => typeof t === 'string' && t.trim().length > 0).slice(0, 20)
    : [];

  const structured = obj.structured && typeof obj.structured === 'object' ? obj.structured : {};
  const params = structured.parameters && typeof structured.parameters === 'object' ? structured.parameters : {};

  return {
    title: String(obj.title).trim().slice(0, 250),
    suggestedCategory: typeof obj.suggestedCategory === 'string' && obj.suggestedCategory.trim().length > 0
      ? obj.suggestedCategory.trim()
      : 'cat-photorealism',
    tags,
    structured: {
      subject: typeof structured.subject === 'string' ? structured.subject.slice(0, 2000) : '',
      environment: typeof structured.environment === 'string' ? structured.environment.slice(0, 2000) : '',
      lighting: typeof structured.lighting === 'string' ? structured.lighting.slice(0, 2000) : '',
      camera: typeof structured.camera === 'string' ? structured.camera.slice(0, 2000) : '',
      composition: typeof structured.composition === 'string' ? structured.composition.slice(0, 2000) : '',
      style: typeof structured.style === 'string' ? structured.style.slice(0, 2000) : '',
      colors: typeof structured.colors === 'string' ? structured.colors.slice(0, 2000) : '',
      instructions: typeof structured.instructions === 'string' ? structured.instructions.slice(0, 2000) : '',
      parameters: {
        aspectRatio: typeof params.aspectRatio === 'string' ? params.aspectRatio : '16:9',
        rawParams: typeof params.rawParams === 'string' ? params.rawParams.slice(0, 500) : '',
        negativePrompt: typeof params.negativePrompt === 'string' ? params.negativePrompt.slice(0, 1000) : '',
        stylize: typeof params.stylize === 'number' ? params.stylize : undefined,
        cfgScale: typeof params.cfgScale === 'number' ? params.cfgScale : undefined,
      },
    },
    formattedPrompt: typeof obj.formattedPrompt === 'string' ? obj.formattedPrompt : '',
    analysisNotes: typeof obj.analysisNotes === 'string' ? obj.analysisNotes.slice(0, 1000) : '',
  };
}
