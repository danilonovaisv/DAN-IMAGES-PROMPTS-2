import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { promptStore, UPLOADS_DIR } from './server/prompts/storage';
import { analyzeAndDecomposePrompt } from './server/ai/promptAnalyzer';
import { validatePromptInput } from './server/validation/promptSchema';
import { importPromptsFromWorkspace, importPromptsFromRawTextAndFiles } from './server/workspace/googleWorkspaceService';

const PORT = 3000;

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos.'));
    }
  },
});

async function startServer() {
  const app = express();

  // Middleware for body parsing
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Serve uploaded images statically
  app.use('/api/uploads', express.static(UPLOADS_DIR));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // AI Prompt Analysis & Decomposition
  app.post('/api/analyze-prompt', async (req, res) => {
    try {
      const { rawPrompt, targetModel, category, imageBase64, imageMimeType, imageUrl } = req.body;

      if (!rawPrompt || typeof rawPrompt !== 'string') {
        return res.status(400).json({ error: 'O texto do prompt é obrigatório para a análise.' });
      }

      const result = await analyzeAndDecomposePrompt({
        rawPrompt,
        targetModel,
        category,
        imageBase64,
        imageMimeType,
        imageUrl,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Erro no endpoint /api/analyze-prompt:', err);
      res.status(500).json({
        error: err.message || 'Erro ao analisar prompt com IA',
      });
    }
  });

  // File Upload endpoint (multipart)
  app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo de imagem foi enviado.' });
      }
      const fileUrl = `/api/uploads/${req.file.filename}`;
      res.json({
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao processar upload de imagem.' });
    }
  });

  // Base64 image upload endpoint (converts base64 to discrete file to prevent Base64 in JSON)
  app.post('/api/upload-base64', (req, res) => {
    try {
      const { data, mimeType = 'image/jpeg' } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Dados base64 ausentes' });
      }

      const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const base64Data = matches ? matches[2] : data;
      const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
      const filename = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      res.json({
        url: `/api/uploads/${filename}`,
        filename,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao salvar imagem base64.' });
    }
  });

  // Prompts CRUD
  app.get('/api/prompts', (req, res) => {
    try {
      const { search, category, model, tag, favorites, sortBy } = req.query;
      const prompts = promptStore.getPrompts({
        search: search as string,
        category: category as string,
        model: model as string,
        tag: tag as string,
        onlyFavorites: favorites === 'true',
        sortBy: sortBy as string,
      });
      res.json(prompts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/prompts/:id', (req, res) => {
    const prompt = promptStore.getPromptById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt não encontrado.' });
    }
    res.json(prompt);
  });

  app.post('/api/prompts', (req, res) => {
    const validation = validatePromptInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const created = promptStore.createPrompt(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/prompts/:id', (req, res) => {
    try {
      const updated = promptStore.updatePrompt(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Prompt não encontrado.' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/prompts/:id', (req, res) => {
    const success = promptStore.deletePrompt(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Prompt não encontrado para exclusão.' });
    }
    res.json({ success: true, message: 'Prompt excluído com sucesso.' });
  });

  app.post('/api/prompts/:id/favorite', (req, res) => {
    const updated = promptStore.toggleFavorite(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Prompt não encontrado.' });
    }
    res.json(updated);
  });

  app.post('/api/prompts/:id/copy', (req, res) => {
    const updated = promptStore.incrementCopyCount(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Prompt não encontrado.' });
    }
    res.json(updated);
  });

  app.post('/api/prompts/:id/duplicate', (req, res) => {
    const duplicated = promptStore.duplicatePrompt(req.params.id);
    if (!duplicated) {
      return res.status(404).json({ error: 'Prompt não encontrado.' });
    }
    res.status(201).json(duplicated);
  });

  // Categories CRUD
  app.get('/api/categories', (req, res) => {
    res.json(promptStore.getCategories());
  });

  app.post('/api/categories', (req, res) => {
    const { name, slug, icon, color, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }
    const created = promptStore.createCategory({
      name: name.trim(),
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      icon: icon || 'Tag',
      color: color || 'indigo',
      description,
    });
    res.status(201).json(created);
  });

  app.put('/api/categories/:id', (req, res) => {
    const updated = promptStore.updateCategory(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }
    res.json(updated);
  });

  app.delete('/api/categories/:id', (req, res) => {
    const success = promptStore.deleteCategory(req.params.id);
    if (!success) {
      return res.status(400).json({ error: 'Não é possível excluir categorias padrão do sistema.' });
    }
    res.json({ success: true });
  });

  // Reset database to initial sample data
  app.post('/api/reset-data', (req, res) => {
    promptStore.resetToDefaults();
    res.json({ success: true, message: 'Dados restaurados para o padrão.' });
  });

  // Google Workspace endpoints
  app.get('/api/workspace/config', (req, res) => {
    res.json({
      defaultDocUrl: 'https://docs.google.com/document/d/1v3R4JZqAWiBfNMCnIamCnvXpcXYKcgI6J9HZkSWmp2I/edit?usp=drive_link',
      defaultFolderUrl: 'https://drive.google.com/drive/folders/1ceHlomDrh3Lu_nmLN_LXxrymIShvMdoK?usp=drive_link',
      defaultDocId: '1v3R4JZqAWiBfNMCnIamCnvXpcXYKcgI6J9HZkSWmp2I',
      defaultFolderId: '1ceHlomDrh3Lu_nmLN_LXxrymIShvMdoK',
      hasGoogleClientId: !!(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID),
    });
  });

  app.post('/api/workspace/import', async (req, res) => {
    try {
      const { accessToken, docUrlOrId, folderUrlOrId, autoAnalyzeWithAI } = req.body;

      if (!accessToken || typeof accessToken !== 'string') {
        return res.status(401).json({
          error: 'Token de autenticação OAuth do Google (accessToken) não fornecido.',
        });
      }

      const result = await importPromptsFromWorkspace({
        accessToken,
        docUrlOrId,
        folderUrlOrId,
        autoAnalyzeWithAI: autoAnalyzeWithAI ?? true,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Erro ao importar prompts do Google Workspace:', err);
      res.status(500).json({
        error: err.message || 'Erro ao processar importação do Google Docs e Drive.',
      });
    }
  });

  // Direct Text & Uploaded Images Batch Import (No OAuth required!)
  app.post('/api/workspace/direct-text-import', async (req, res) => {
    try {
      const { rawText, imageFiles, autoAnalyzeWithAI } = req.body;

      if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return res.status(400).json({
          error: 'Por favor, forneça o texto dos prompts para importação.',
        });
      }

      const result = await importPromptsFromRawTextAndFiles({
        rawText,
        imageFiles: Array.isArray(imageFiles) ? imageFiles : [],
        autoAnalyzeWithAI: autoAnalyzeWithAI ?? true,
      });

      res.json(result);
    } catch (err: any) {
      console.error('Erro ao importar texto de prompts:', err);
      res.status(500).json({
        error: err.message || 'Erro ao processar importação de texto e imagens.',
      });
    }
  });

  // Batch Image Upload endpoint
  app.post('/api/workspace/upload-batch-images', upload.array('images', 50), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
      }

      const uploadedList = files.map(file => ({
        originalName: file.originalname,
        localUrl: `/api/uploads/${file.filename}`,
        size: file.size,
      }));

      res.json({
        success: true,
        count: uploadedList.length,
        files: uploadedList,
      });
    } catch (err: any) {
      console.error('Erro no upload em lote de imagens:', err);
      res.status(500).json({ error: 'Falha ao processar upload das imagens.' });
    }
  });

  // --- Vite / Frontend Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DAN IMAGES PROMPTS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
