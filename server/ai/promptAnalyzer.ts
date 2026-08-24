import { Type } from '@google/genai';
import { getGeminiAI } from './gemini';

export interface AnalyzePromptInput {
  rawPrompt: string;
  targetModel?: string;
  category?: string;
  imageBase64?: string;
  imageMimeType?: string;
  imageUrl?: string;
}

export interface StructuredAnalysisResult {
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
      stylize?: number | string;
      seed?: number | string;
      negativePrompt?: string;
      cfgScale?: number | string;
      rawParams?: string;
    };
  };
  formattedPrompt: string;
  analysisNotes?: string;
}

export async function analyzeAndDecomposePrompt(input: AnalyzePromptInput): Promise<StructuredAnalysisResult> {
  const { rawPrompt, targetModel = 'midjourney-v6', imageBase64, imageMimeType } = input;

  if (!process.env.GEMINI_API_KEY) {
    return generateFallbackStructuredPrompt(rawPrompt, targetModel);
  }

  try {
    const ai = getGeminiAI();

    const systemInstruction = `Você é o DAN IMAGES PROMPTS AI, um especialista sênior em engenharia de prompts e direção de arte para IA generativa (Midjourney, Flux, DALL-E, SDXL, Imagen).
Sua missão é analisar meticulosamente o prompt textual fornecido e/ou a imagem de referência anexada, decompondo-o em uma estrutura rica, profissional e precisa.

DIRETRIZES FUNDAMENTAIS:
1. NUNCA invente informações visuais que não possam ser inferidas ou que contradigam o texto/imagem do usuário.
2. Extraia cada elemento para o campo estruturado correto:
   - subject: O sujeito principal, personagem, objeto ou foco da imagem.
   - environment: Cenário, fundo, localização, atmosfera, clima e espaço ao redor.
   - lighting: Tipo de luz (volumétrica, natural, estúdio, neon, chiaroscuro, dourada, etc.) e sua direção/qualidade.
   - camera: Especificações de lente (ex: 35mm, 85mm, macro), ângulo de visão, profundidade de campo e sensor.
   - composition: Enquadramento (regra dos terços, simetria, plano médio, close-up, proporção áurea).
   - style: Estilo artístico, técnica (fotografia editorial, pintura digital, 3D render, aquarela, etc.) e referências estéticas.
   - colors: Paleta cromática predominante, tons, saturação e contrastes de cor.
   - instructions: Recomendações técnicas, aspectos a evitar, ou instruções adicionais de renderização.
   - parameters: Parâmetros específicos (como aspect ratio, --ar, --v, negative prompt, etc.).
3. Gere um título conciso e marcante (máximo 6 a 8 palavras em Português).
4. Sugira uma categoria e 4 a 8 tags relevantes e úteis para busca.
5. Formate um prompt final limpo e otimizado para o modelo de destino informado (${targetModel}).
6. Escreva os campos estruturados em Português claro e descritivo, mantendo termos técnicos de fotografia/computação gráfica universais.`;

    const promptText = `Analise o seguinte prompt para o modelo "${targetModel}":
"${rawPrompt}"
${input.category ? `Categoria atual selecionada: ${input.category}` : ''}
${imageBase64 ? 'Uma imagem de referência visual foi anexada. Incorpore os detalhes visuais reais presentes nela na análise.' : ''}`;

    const parts: any[] = [{ text: promptText }];

    if (imageBase64 && imageMimeType) {
      parts.unshift({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Título conciso e descritivo para o prompt em português',
            },
            suggestedCategory: {
              type: Type.STRING,
              description: 'Categoria sugerida (ex: photorealism, cinematic, architecture, character, product, landscapes, illustration, editorial)',
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4 a 8 tags descritivas para catalogação e busca',
            },
            subject: {
              type: Type.STRING,
              description: 'Descrição precisa do sujeito principal',
            },
            environment: {
              type: Type.STRING,
              description: 'Descrição do ambiente, cenário e atmosfera',
            },
            lighting: {
              type: Type.STRING,
              description: 'Descrição da iluminação, fontes de luz e sombras',
            },
            camera: {
              type: Type.STRING,
              description: 'Descrição da câmera, lente, ângulo e profundidade de campo',
            },
            composition: {
              type: Type.STRING,
              description: 'Descrição da composição e enquadramento',
            },
            style: {
              type: Type.STRING,
              description: 'Descrição do estilo artístico, estética e renderização',
            },
            colors: {
              type: Type.STRING,
              description: 'Descrição da paleta de cores e tonalidades',
            },
            instructions: {
              type: Type.STRING,
              description: 'Instruções técnicas, qualidade ou aspectos a evitar',
            },
            aspectRatio: {
              type: Type.STRING,
              description: 'Proporção recomendada, ex: 16:9, 4:5, 1:1, 9:16',
            },
            negativePrompt: {
              type: Type.STRING,
              description: 'Elementos indesejados para negative prompt se aplicável',
            },
            rawParams: {
              type: Type.STRING,
              description: 'Parâmetros brutos em sintaxe do modelo (ex: --ar 16:9 --v 6.1)',
            },
            formattedPrompt: {
              type: Type.STRING,
              description: 'Prompt otimizado e bem pontuado para envio ao gerador de imagem',
            },
            analysisNotes: {
              type: Type.STRING,
              description: 'Breve nota com dicas de como tirar o melhor proveito deste prompt',
            },
          },
          required: [
            'title',
            'suggestedCategory',
            'tags',
            'subject',
            'environment',
            'lighting',
            'camera',
            'composition',
            'style',
            'colors',
            'formattedPrompt',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Resposta vazia da IA');
    }

    const parsed = JSON.parse(text);

    return {
      title: parsed.title || 'Prompt de Imagem Estruturado',
      suggestedCategory: parsed.suggestedCategory || 'photorealism',
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['IA', 'Imagem'],
      structured: {
        subject: parsed.subject || '',
        environment: parsed.environment || '',
        lighting: parsed.lighting || '',
        camera: parsed.camera || '',
        composition: parsed.composition || '',
        style: parsed.style || '',
        colors: parsed.colors || '',
        instructions: parsed.instructions || '',
        parameters: {
          aspectRatio: parsed.aspectRatio || '16:9',
          negativePrompt: parsed.negativePrompt || '',
          rawParams: parsed.rawParams || '',
        },
      },
      formattedPrompt: parsed.formattedPrompt || rawPrompt,
      analysisNotes: parsed.analysisNotes || '',
    };
  } catch (error) {
    console.error('Erro na análise de prompt via Gemini:', error);
    // Fallback preserving all user data
    return generateFallbackStructuredPrompt(rawPrompt, targetModel);
  }
}

export function generateFallbackStructuredPrompt(rawPrompt: string, targetModel: string): StructuredAnalysisResult {
  // Heuristic extraction
  const arMatch = rawPrompt.match(/--ar\s+([0-9:]+)/i) || rawPrompt.match(/aspect\s+ratio\s+([0-9:]+)/i);
  const ar = arMatch ? arMatch[1] : '16:9';

  // Extract params
  const paramMatch = rawPrompt.match(/--[a-z0-9\s.-]+/gi);
  const rawParams = paramMatch ? paramMatch.join(' ') : '';

  // Clean prompt text
  const cleanPrompt = rawPrompt.replace(/--[a-z0-9\s.-]+/gi, '').trim();

  // Extract potential style keywords
  const styleTokens: string[] = [];
  if (/photo|fotografia|portrait|realistic/i.test(rawPrompt)) styleTokens.push('Fotografia Realista');
  if (/cinematic|cinem[aá]tico|movie/i.test(rawPrompt)) styleTokens.push('Cinemático');
  if (/3d|render|octane|unreal/i.test(rawPrompt)) styleTokens.push('3D Render');
  if (/neon|cyberpunk/i.test(rawPrompt)) styleTokens.push('Cyberpunk');
  if (/anime|manga|illustration|aquarela|painting/i.test(rawPrompt)) styleTokens.push('Arte Digital');

  const words = cleanPrompt.split(/\s+/);
  const titleCandidate = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');

  return {
    title: titleCandidate ? `Prompt: ${titleCandidate}` : 'Prompt Estruturado',
    suggestedCategory: styleTokens.includes('Fotografia Realista') ? 'cat-photorealism' : 'cat-cinematic',
    tags: styleTokens.length > 0 ? styleTokens : ['IA', 'Imagem', 'Gerativo', targetModel],
    structured: {
      subject: cleanPrompt.slice(0, 180),
      environment: 'Ambiente detalhado com atmosfera coerente com o sujeito',
      lighting: 'Iluminação equilibrada com luz principal e sombras suaves',
      camera: 'Lente padrão com nitidez detalhada e profundidade de campo controlada',
      composition: 'Enquadramento focado no tema central com proporção harmoniosa',
      style: styleTokens.join(', ') || 'Estilo visual de alta fidelidade',
      colors: 'Paleta cromática balanceada e contraste dinâmico',
      instructions: 'Ajuste os parâmetros conforme o modelo desejado.',
      parameters: {
        aspectRatio: ar,
        rawParams: rawParams,
      },
    },
    formattedPrompt: rawPrompt,
    analysisNotes: 'Estruturação local gerada. Edite os campos conforme necessário antes de salvar.',
  };
}
