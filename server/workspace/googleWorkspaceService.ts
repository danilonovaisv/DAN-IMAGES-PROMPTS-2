import fs from 'fs';
import path from 'path';
import { promptStore, UPLOADS_DIR } from '../prompts/storage';
import { analyzeAndDecomposePrompt } from '../ai/promptAnalyzer';
import { PromptItem, StructuredPromptData, ImageReference } from '../../src/types';
import { imageStore } from '../storage/imageStore';

export interface ImportWorkspaceParams {
  accessToken: string;
  docUrlOrId?: string;
  folderUrlOrId?: string;
  autoAnalyzeWithAI?: boolean;
}

export interface ImportResult {
  success: boolean;
  totalParsed: number;
  importedCount: number;
  updatedCount: number;
  matchedImagesCount: number;
  importedPrompts: PromptItem[];
  warnings: string[];
}

export function extractGoogleDocId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export function extractGoogleDriveFolderId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

interface ParsedDocSection {
  rawTitle: string;
  rawContent: string;
  model?: string;
  category?: string;
  aspectRatio?: string;
  tags?: string[];
  parameters?: Record<string, string>;
}

// Helper to normalize string for comparison (removes extensions, accents, special chars)
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/\.[a-z0-9]{3,4}$/i, '') // remove file extension
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]/g, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent file matcher matching prompt sections to images by name, number, or keywords
 */
function findBestMatchingFile<T extends { normalizedName: string }>(
  sectionTitle: string,
  sectionContent: string,
  availableFiles: T[],
  usedIndices: Set<number>
): { match: T; index: number } | null {
  const normTitle = normalizeName(sectionTitle);
  const normContent = normalizeName(sectionContent);
  const titleWords = normTitle.split(/\s+/).filter(w => w.length >= 3);

  // 1. Exact or substring match on title
  for (let idx = 0; idx < availableFiles.length; idx++) {
    if (usedIndices.has(idx)) continue;
    const item = availableFiles[idx];
    if (
      item.normalizedName === normTitle ||
      (normTitle.length >= 4 && item.normalizedName.includes(normTitle)) ||
      (item.normalizedName.length >= 4 && normTitle.includes(item.normalizedName))
    ) {
      return { match: item, index: idx };
    }
  }

  // 2. Number index match (e.g. "13. FULL BODY SHOT" matching "13_Full_body_shot.jpg")
  const titleNumMatch = sectionTitle.match(/\b\d+\b/);
  if (titleNumMatch) {
    const num = parseInt(titleNumMatch[0], 10);
    for (let idx = 0; idx < availableFiles.length; idx++) {
      if (usedIndices.has(idx)) continue;
      const item = availableFiles[idx];
      const fileNumMatch = item.normalizedName.match(/\b\d+\b/);
      if (fileNumMatch && parseInt(fileNumMatch[0], 10) === num) {
        return { match: item, index: idx };
      }
    }
  }

  // 3. Keyword / Token overlap scoring
  let bestScore = 0;
  let bestIdx = -1;

  for (let idx = 0; idx < availableFiles.length; idx++) {
    if (usedIndices.has(idx)) continue;
    const item = availableFiles[idx];
    const fileWords = item.normalizedName.split(/\s+/).filter(w => w.length >= 3 && !/^\d+$/.test(w));

    let score = 0;
    for (const fWord of fileWords) {
      if (titleWords.includes(fWord) || normTitle.includes(fWord)) {
        score += 3;
      } else if (normContent.includes(fWord)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  }

  // Require meaningful keyword match (score >= 3, meaning at least one significant title word match)
  if (bestScore >= 3 && bestIdx !== -1) {
    return { match: availableFiles[bestIdx], index: bestIdx };
  }

  return null;
}

/**
 * Downloads a binary file from Google Drive and saves it to uploads directory
 * and persists it durably to Firestore
 */
async function downloadDriveFile(
  fileId: string,
  fileName: string,
  mimeType: string,
  accessToken: string
): Promise<string> {
  const ext = path.extname(fileName) || (mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg');
  const safeBase = fileName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const uniqueFilename = `drive-${Date.now()}-${safeBase}${ext}`;

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao baixar imagem do Google Drive (${fileId}): ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Save durably to Firestore and disk cache via imageStore
  const url = await imageStore.saveImage(uniqueFilename, buffer, mimeType);
  return url;
}

/**
 * Recursively extracts plain text and paragraph structures from Google Docs document JSON
 */
function extractDocParagraphs(docData: any): Array<{ text: string; style: string }> {
  const paragraphs: Array<{ text: string; style: string }> = [];

  function processStructuralElement(el: any) {
    if (el.paragraph) {
      const style = el.paragraph.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
      let fullText = '';
      if (el.paragraph.elements) {
        for (const elem of el.paragraph.elements) {
          if (elem.textRun && elem.textRun.content) {
            fullText += elem.textRun.content;
          }
        }
      }
      if (fullText.trim().length > 0) {
        paragraphs.push({ text: fullText.trim(), style });
      }
    } else if (el.table) {
      if (el.table.tableRows) {
        for (const row of el.table.tableRows) {
          if (row.tableCells) {
            for (const cell of row.tableCells) {
              if (cell.content) {
                for (const cellEl of cell.content) {
                  processStructuralElement(cellEl);
                }
              }
            }
          }
        }
      }
    }
  }

  if (docData.body && docData.body.content) {
    for (const el of docData.body.content) {
      processStructuralElement(el);
    }
  }

  return paragraphs;
}

/**
 * Parses paragraphs from a Google Doc into structured prompt blocks
 */
function parsePromptsFromDoc(paragraphs: Array<{ text: string; style: string }>): ParsedDocSection[] {
  const sections: ParsedDocSection[] = [];
  let currentSection: ParsedDocSection | null = null;

  for (const p of paragraphs) {
    const text = p.text;
    const isHeading =
      p.style.startsWith('HEADING') ||
      p.style === 'TITLE' ||
      /^(Prompt\s*\d+|Imagem\s*\d+|Arte\s*\d+|Visual\s*\d+|#+|\d+[\.\-\)]\s*)/i.test(text) ||
      (text.length < 80 && text.endsWith(':') && !text.toLowerCase().startsWith('prompt:'));

    if (isHeading && text.length < 120) {
      if (currentSection && currentSection.rawContent.trim()) {
        sections.push(currentSection);
      }
      // Clean title
      const cleanTitle = text.replace(/^#+\s*/, '').replace(/:$/, '').trim();
      currentSection = {
        rawTitle: cleanTitle,
        rawContent: '',
      };
    } else {
      if (!currentSection) {
        currentSection = {
          rawTitle: text.length > 50 ? text.substring(0, 50) + '...' : text,
          rawContent: text,
        };
      } else {
        if (currentSection.rawContent) {
          currentSection.rawContent += '\n\n' + text;
        } else {
          currentSection.rawContent = text;
        }
      }
    }
  }

  if (currentSection && currentSection.rawContent.trim()) {
    sections.push(currentSection);
  }

  // If no sections were separated by headings, split on double newlines or standard separators
  if (sections.length <= 1 && paragraphs.length > 1) {
    const allText = paragraphs.map(p => p.text).join('\n\n');
    const splitRegex = /(?:^|\n)(?=(?:Prompt\s*\d+|Imagem\s*\d+|\d+[\.\-\)]\s+|###?\s+))/i;
    const rawChunks = allText.split(splitRegex).map(c => c.trim()).filter(Boolean);

    if (rawChunks.length > 1) {
      return rawChunks.map((chunk, idx) => {
        const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
        const title = lines[0] || `Prompt ${idx + 1}`;
        const content = lines.slice(1).join('\n') || lines[0];
        return {
          rawTitle: title.replace(/^#+\s*/, '').substring(0, 60),
          rawContent: content,
        };
      });
    }
  }

  return sections;
}

/**
 * Main function to import prompts from Google Docs and Google Drive
 */
export async function importPromptsFromWorkspace(
  params: ImportWorkspaceParams
): Promise<ImportResult> {
  const { accessToken, autoAnalyzeWithAI = true } = params;

  const defaultDocId = '1v3R4JZqAWiBfNMCnIamCnvXpcXYKcgI6J9HZkSWmp2I';
  const defaultFolderId = '1ceHlomDrh3Lu_nmLN_LXxrymIShvMdoK';

  const docId = params.docUrlOrId ? extractGoogleDocId(params.docUrlOrId) : defaultDocId;
  const folderId = params.folderUrlOrId ? extractGoogleDriveFolderId(params.folderUrlOrId) : defaultFolderId;

  const warnings: string[] = [];

  // 1. Fetch Google Drive Folder Files
  let driveFiles: DriveFile[] = [];
  try {
    const driveQuery = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${driveQuery}&fields=files(id,name,mimeType,size)&pageSize=1000`;
    
    const driveRes = await fetch(driveUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      if (driveRes.status === 401) {
        warnings.push('Aviso de Autenticação no Google Drive (401): O token não possui permissão ou expirou para a pasta.');
      } else {
        warnings.push(`Aviso ao acessar o Google Drive: status ${driveRes.status}`);
      }
    } else {
      const driveData = await driveRes.json();
      driveFiles = (driveData.files || []).filter((f: DriveFile) => f.mimeType.startsWith('image/'));
    }
  } catch (err: any) {
    console.error('Erro ao listar arquivos do Google Drive:', err);
    warnings.push(`Aviso ao acessar o Google Drive: ${err.message}`);
  }

  // 2. Fetch Google Docs Document
  let docData: any = null;
  try {
    const docUrl = `https://docs.googleapis.com/v1/documents/${docId}`;
    const docRes = await fetch(docUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!docRes.ok) {
      const errText = await docRes.text();
      if (docRes.status === 401) {
        throw new Error(
          'Token de autorização do Google inválido ou expirado (401). Conecte novamente sua conta Google na aba OAuth ou utilize a aba "Colar Conteúdo & Imagens" para importar imediatamente sem depender de token.'
        );
      }
      throw new Error(`Google Docs API retornou status ${docRes.status}: ${errText}`);
    }

    docData = await docRes.json();
  } catch (err: any) {
    console.error('Erro ao obter documento do Google Docs:', err);
    throw new Error(`Não foi possível carregar o arquivo do Google Docs: ${err.message}`);
  }

  // 3. Parse Document Content
  const paragraphs = extractDocParagraphs(docData);
  const parsedSections = parsePromptsFromDoc(paragraphs);

  if (parsedSections.length === 0) {
    throw new Error('Nenhum prompt ou seção de texto foi encontrado no documento do Google Docs.');
  }

  // Map drive files with normalized keys for quick lookup
  const driveFilesNormalized = driveFiles.map(file => ({
    file,
    normalizedName: normalizeName(file.name),
  }));

  const importedPrompts: PromptItem[] = [];
  const usedFileIndices = new Set<number>();
  let matchedImagesCount = 0;
  let updatedCount = 0;
  let importedCount = 0;

  // Fetch existing prompts once to optimize performance
  const existingPrompts = await promptStore.getPrompts();

  // Process each parsed section
  for (let i = 0; i < parsedSections.length; i++) {
    const section = parsedSections[i];
    const sectionTitleNormalized = normalizeName(section.rawTitle);

    // Find matching Drive image using intelligent matcher
    const matchResult = findBestMatchingFile(
      section.rawTitle,
      section.rawContent,
      driveFilesNormalized,
      usedFileIndices
    );

    let matchedFile: DriveFile | null = null;
    if (matchResult) {
      matchedFile = matchResult.match.file;
      usedFileIndices.add(matchResult.index);
    }

    let imageUrl: string | undefined;

    if (matchedFile) {
      try {
        imageUrl = await downloadDriveFile(matchedFile.id, matchedFile.name, matchedFile.mimeType, accessToken);
        matchedImagesCount++;
      } catch (dlErr: any) {
        console.warn(`Erro ao baixar imagem correspondente '${matchedFile.name}':`, dlErr);
        warnings.push(`Não foi possível baixar a imagem '${matchedFile.name}': ${dlErr.message}`);
      }
    }

    // AI Analysis / Extraction of Structured Fields
    let decomposedData: any = null;
    if (autoAnalyzeWithAI && process.env.GEMINI_API_KEY) {
      try {
        decomposedData = await analyzeAndDecomposePrompt({
          rawPrompt: section.rawContent || section.rawTitle,
          targetModel: 'midjourney-v6',
          imageUrl,
        });
      } catch (aiErr) {
        console.warn(`Análise Gemini falhou para ${section.rawTitle}, usando valores padrão:`, aiErr);
      }
    }

    // Check if prompt already exists by title
    const existing = existingPrompts.find(
      p => normalizeName(p.title) === sectionTitleNormalized
    );

    // Build prompt payload
    const title = section.rawTitle || decomposedData?.title || `Prompt ${i + 1}`;
    const rawPrompt = section.rawContent || section.rawTitle;
    const category = decomposedData?.suggestedCategory || 'fotografia';
    const targetModel = 'midjourney-v6';
    const tags = decomposedData?.tags || ['google-docs', 'drive-import'];

    const imageRef: ImageReference | undefined = imageUrl
      ? {
          url: imageUrl,
          storageType: 'local',
          aspectRatio: '16:9',
          alt: title,
        }
      : existing?.image;

    const structuredData: StructuredPromptData = decomposedData?.structured || {
      subject: title,
      environment: 'Realistic studio / cinematic setup',
      lighting: 'Cinematic studio lighting',
      camera: 'Eye-level shot, 85mm lens',
      composition: 'Rule of thirds, sharp focus',
      style: 'Photorealistic, High Detail',
      colors: 'Rich contrast, natural color grading',
      parameters: {
        aspectRatio: '16:9',
        stylize: '250',
      },
    };

    const promptPayload: Omit<PromptItem, 'id' | 'createdAt' | 'updatedAt' | 'copyCount'> = {
      title,
      rawPrompt,
      category,
      targetModel,
      image: imageRef,
      tags: Array.from(new Set([...tags, 'google-workspace'])),
      structured: structuredData,
      isFavorite: existing ? existing.isFavorite : false,
      notes: `Importado do Google Docs & Drive.`,
    };

    if (existing) {
      const updated = await promptStore.updatePrompt(existing.id, promptPayload);
      if (updated) {
        importedPrompts.push(updated);
        updatedCount++;
      }
    } else {
      const created = await promptStore.createPrompt(promptPayload);
      importedPrompts.push(created);
      importedCount++;
    }
  }

  return {
    success: true,
    totalParsed: parsedSections.length,
    importedCount,
    updatedCount,
    matchedImagesCount,
    importedPrompts,
    warnings,
  };
}

export interface DirectImportParams {
  rawText: string;
  imageFiles?: Array<{ originalName: string; localUrl: string }>;
  autoAnalyzeWithAI?: boolean;
}

export async function importPromptsFromRawTextAndFiles(
  params: DirectImportParams
): Promise<ImportResult> {
  const { rawText, imageFiles = [], autoAnalyzeWithAI = true } = params;
  const warnings: string[] = [];

  if (!rawText || !rawText.trim()) {
    throw new Error('Nenhum texto de prompts foi fornecido para importação.');
  }

  // Split lines into paragraphs
  const rawParagraphs = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(text => ({
      text,
      style: /^#+\s*|^(?:Prompt\s*\d+|Imagem\s*\d+|\d+[\.\-\)])/i.test(text)
        ? 'HEADING_1'
        : 'NORMAL_TEXT',
    }));

  const parsedSections = parsePromptsFromDoc(rawParagraphs);

  if (parsedSections.length === 0) {
    throw new Error('Não foi possível identificar seções de prompts no texto informado.');
  }

  const normalizedImages = imageFiles.map(img => ({
    originalName: img.originalName,
    localUrl: img.localUrl,
    normalizedName: normalizeName(img.originalName),
  }));

  const importedPrompts: PromptItem[] = [];
  const usedImageIndices = new Set<number>();
  let matchedImagesCount = 0;
  let updatedCount = 0;
  let importedCount = 0;

  // Fetch existing prompts once to optimize performance
  const existingPrompts = await promptStore.getPrompts();

  for (let i = 0; i < parsedSections.length; i++) {
    const section = parsedSections[i];
    const sectionTitleNormalized = normalizeName(section.rawTitle);

    // Find match among uploaded images using intelligent matcher
    const matchResult = findBestMatchingFile(
      section.rawTitle,
      section.rawContent,
      normalizedImages,
      usedImageIndices
    );

    let imageUrl: string | undefined;
    if (matchResult) {
      imageUrl = matchResult.match.localUrl;
      usedImageIndices.add(matchResult.index);
      matchedImagesCount++;
    }

    // AI Analysis if available
    let decomposedData: any = null;
    if (autoAnalyzeWithAI && process.env.GEMINI_API_KEY) {
      try {
        decomposedData = await analyzeAndDecomposePrompt({
          rawPrompt: section.rawContent || section.rawTitle,
          targetModel: 'midjourney-v6',
          imageUrl,
        });
      } catch (aiErr) {
        console.warn(`Análise Gemini falhou para ${section.rawTitle}:`, aiErr);
      }
    }

    const existing = existingPrompts.find(
      p => normalizeName(p.title) === sectionTitleNormalized
    );

    const title = section.rawTitle || decomposedData?.title || `Prompt ${i + 1}`;
    const rawPrompt = section.rawContent || section.rawTitle;
    const category = decomposedData?.suggestedCategory || 'geral';
    const targetModel = 'midjourney-v6';
    const tags = decomposedData?.tags || ['google-docs', 'google-drive'];

    const imageRef: ImageReference | undefined = imageUrl
      ? {
          url: imageUrl,
          storageType: 'local',
          aspectRatio: '16:9',
          alt: title,
        }
      : existing?.image;

    const structuredData: StructuredPromptData = decomposedData?.structured || {
      subject: title,
      environment: 'Realistic / cinematic environment',
      lighting: 'Cinematic studio lighting',
      camera: 'Eye-level shot',
      composition: 'Balanced composition',
      style: 'Photorealistic, high quality',
      colors: 'Natural tones',
      parameters: {
        aspectRatio: '16:9',
        stylize: '250',
      },
    };

    const promptPayload: Omit<PromptItem, 'id' | 'createdAt' | 'updatedAt' | 'copyCount'> = {
      title,
      rawPrompt,
      category,
      targetModel,
      image: imageRef,
      tags: Array.from(new Set([...tags, 'importado-docs'])),
      structured: structuredData,
      isFavorite: existing ? existing.isFavorite : false,
      notes: `Importado de Google Docs e imagens do Google Drive.`,
    };

    if (existing) {
      const updated = await promptStore.updatePrompt(existing.id, promptPayload);
      if (updated) {
        importedPrompts.push(updated);
        updatedCount++;
      }
    } else {
      const created = await promptStore.createPrompt(promptPayload);
      importedPrompts.push(created);
      importedCount++;
    }
  }

  return {
    success: true,
    totalParsed: parsedSections.length,
    importedCount,
    updatedCount,
    matchedImagesCount,
    importedPrompts,
    warnings,
  };
}


