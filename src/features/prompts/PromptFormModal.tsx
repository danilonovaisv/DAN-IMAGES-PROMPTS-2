import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PromptItem, Category, StructuredPromptData } from '../../types';
import { AI_MODELS } from '../../data/aiModels';
import { ApiService } from '../../services/api';
import { useToast } from '../../components/Toast';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Loader2,
  Check,
  FileText,
} from 'lucide-react';

interface PromptFormModalProps {
  isOpen: boolean;
  initialPrompt?: PromptItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (prompt: PromptItem) => void;
}

export const PromptFormModal: React.FC<PromptFormModalProps> = ({
  isOpen,
  initialPrompt,
  categories,
  onClose,
  onSaved,
}) => {
  const isEditing = !!initialPrompt;
  const { showToast } = useToast();

  // Form State
  const [rawPrompt, setRawPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [targetModel, setTargetModel] = useState<string>('midjourney-v6');
  const [category, setCategory] = useState<string>('cat-photorealism');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');

  // Image State
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Structured Fields State
  const [structured, setStructured] = useState<StructuredPromptData>({
    subject: '',
    environment: '',
    lighting: '',
    camera: '',
    composition: '',
    style: '',
    colors: '',
    instructions: '',
    parameters: {
      aspectRatio: '16:9',
      rawParams: '',
    },
  });

  // UI Flow State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'structure'>('prompt');

  // Populate data when editing or opening
  useEffect(() => {
    if (initialPrompt) {
      setRawPrompt(initialPrompt.rawPrompt || '');
      setTitle(initialPrompt.title || '');
      setTargetModel(initialPrompt.targetModel || 'midjourney-v6');
      setCategory(initialPrompt.category || categories[0]?.id || 'cat-photorealism');
      setTags(initialPrompt.tags || []);
      setNotes(initialPrompt.notes || '');
      setImageUrl(initialPrompt.image?.url || '');
      setImageBase64(null);
      setStructured(
        initialPrompt.structured || {
          subject: '',
          environment: '',
          lighting: '',
          camera: '',
          composition: '',
          style: '',
          colors: '',
          instructions: '',
          parameters: { aspectRatio: '16:9' },
        }
      );
      setActiveTab('structure'); // When editing, go straight to review
    } else {
      // Reset form
      setRawPrompt('');
      setTitle('');
      setTargetModel('midjourney-v6');
      setCategory(categories[0]?.id || 'cat-photorealism');
      setTags([]);
      setTagInput('');
      setNotes('');
      setImageUrl('');
      setImageBase64(null);
      setUrlInput('');
      setStructured({
        subject: '',
        environment: '',
        lighting: '',
        camera: '',
        composition: '',
        style: '',
        colors: '',
        instructions: '',
        parameters: { aspectRatio: '16:9' },
      });
      setActiveTab('prompt');
    }
    setAnalysisError(null);
  }, [initialPrompt, isOpen, categories]);

  if (!isOpen) return null;

  // Handle image file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      // Read as base64 for Gemini analysis
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        setImageBase64(result);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);

      // Upload file to server to save as discrete file (not embedded Base64 in JSON)
      const uploadRes = await ApiService.uploadImageFile(file);
      setImageUrl(uploadRes.url);
      showToast('Imagem carregada!', 'Referência visual anexada com sucesso.', 'success', 2000);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      showToast('Erro no upload', err.message || 'Não foi possível carregar o arquivo.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle image by URL
  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setImageUrl(urlInput.trim());
    setUrlInput('');
    showToast('Imagem vinculada!', 'URL da imagem definida.', 'info', 2000);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Tags
  const handleAddTag = () => {
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Trigger Gemini AI Decomposition
  const handleAnalyzeWithAI = async () => {
    if (!rawPrompt.trim()) {
      showToast('Atenção', 'Digite o prompt bruto antes de solicitar a estruturação.', 'info');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStep('Examinando texto e contexto visual...');

    try {
      const stepTimer1 = setTimeout(() => {
        setAnalysisStep('Decompondo sujeito, iluminação, câmera e estilo...');
      }, 1000);

      const stepTimer2 = setTimeout(() => {
        setAnalysisStep('Formatando estrutura e parâmetros do modelo...');
      }, 2200);

      const analysis = await ApiService.analyzePrompt({
        rawPrompt: rawPrompt.trim(),
        targetModel,
        category,
        imageBase64: imageBase64 || undefined,
        imageMimeType: imageMimeType,
        imageUrl: imageUrl || undefined,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      // Fill in structured results
      if (!title || title.trim() === '') {
        setTitle(analysis.title);
      } else {
        if (!title.trim()) setTitle(analysis.title);
      }

      if (analysis.tags && analysis.tags.length > 0) {
        const merged = Array.from(new Set([...tags, ...analysis.tags]));
        setTags(merged);
      }

      // Match suggested category if available
      if (analysis.suggestedCategory) {
        const matchedCat = categories.find(
          c =>
            c.slug.toLowerCase() === analysis.suggestedCategory.toLowerCase() ||
            c.id.toLowerCase().includes(analysis.suggestedCategory.toLowerCase())
        );
        if (matchedCat) {
          setCategory(matchedCat.id);
        }
      }

      setStructured(analysis.structured);
      setActiveTab('structure');
      showToast('Prompt Estruturado com Sucesso!', 'Revise os campos gerados e ajuste se desejar.', 'success');
    } catch (err: any) {
      console.error('Falha na estruturação:', err);
      setAnalysisError(err.message || 'Não foi possível completar a análise com IA.');
      showToast('Aviso de Análise', 'Não foi possível analisar via IA. Seus dados foram preservados para edição manual.', 'info');
      setActiveTab('structure');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Submit / Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rawPrompt.trim()) {
      showToast('Campo Obrigatório', 'O texto do prompt bruto é obrigatório.', 'error');
      setActiveTab('prompt');
      return;
    }

    const finalTitle = title.trim() || rawPrompt.slice(0, 40) + '...';

    setIsSaving(true);
    try {
      const payload: Omit<PromptItem, 'id' | 'createdAt' | 'updatedAt' | 'copyCount'> = {
        title: finalTitle,
        rawPrompt: rawPrompt.trim(),
        targetModel,
        category,
        tags,
        notes: notes.trim(),
        isFavorite: initialPrompt ? initialPrompt.isFavorite : false,
        image: imageUrl
          ? {
              url: imageUrl,
              storageType: imageUrl.startsWith('/api/uploads') ? 'local' : 'external',
              aspectRatio: structured.parameters?.aspectRatio || '16:9',
            }
          : undefined,
        structured: {
          subject: structured.subject || '',
          environment: structured.environment || '',
          lighting: structured.lighting || '',
          camera: structured.camera || '',
          composition: structured.composition || '',
          style: structured.style || '',
          colors: structured.colors || '',
          instructions: structured.instructions || '',
          parameters: {
            aspectRatio: structured.parameters?.aspectRatio || '16:9',
            stylize: structured.parameters?.stylize || undefined,
            negativePrompt: structured.parameters?.negativePrompt || '',
            rawParams: structured.parameters?.rawParams || '',
          },
        },
      };

      let saved: PromptItem;
      if (isEditing && initialPrompt) {
        saved = await ApiService.updatePrompt(initialPrompt.id, payload);
        showToast('Prompt atualizado!', 'Alterações salvas com sucesso.', 'success');
      } else {
        saved = await ApiService.createPrompt(payload);
        showToast('Prompt cadastrado!', 'Adicionado com sucesso à biblioteca.', 'success');
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar prompt:', err);
      showToast('Erro ao salvar', err.message || 'Falha ao salvar o prompt.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-black text-white border-2 border-black">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  {isEditing ? 'EDITAR PROMPT' : 'NOVO PROMPT DE IMAGEM'}
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {isEditing ? 'Atualize as instruções e campos estruturados' : 'Escreva o prompt bruto e estruture com Gemini AI'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-black hover:bg-gray-100 border-2 border-black transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Form Tabs */}
          <div className="flex items-center border-b-2 border-black bg-gray-50 px-5 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('prompt')}
              className={`py-3 px-3 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'prompt'
                  ? 'border-black text-black bg-white -mb-[2px] border-t-2 border-l-2 border-r-2'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>1. PROMPT & IMAGEM BRUTA</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('structure')}
              className={`py-3 px-3 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'structure'
                  ? 'border-black text-black bg-white -mb-[2px] border-t-2 border-l-2 border-r-2'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>2. ESTRUTURA & METADADOS</span>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-white">
            {activeTab === 'prompt' ? (
              <div className="space-y-5">
                {/* Raw Prompt Textarea */}
                <div>
                  <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                    Texto Bruto do Prompt <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rawPrompt}
                    onChange={e => setRawPrompt(e.target.value)}
                    placeholder="Ex: Cinematic portrait of an astronaut looking at alien crystalline flora, volumetric magenta and cyan fog, 35mm anamorphic lens, shallow depth of field --ar 16:9 --v 6.1"
                    className="w-full p-3.5 bg-white border-2 border-black focus:bg-gray-50 rounded-none text-sm text-black placeholder-gray-400 outline-none leading-relaxed font-mono resize-y shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    required
                  />
                </div>

                {/* Model & Category Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                      Modelo de Destino
                    </label>
                    <select
                      value={targetModel}
                      onChange={e => setTargetModel(e.target.value)}
                      className="w-full p-3 bg-white border-2 border-black text-xs sm:text-sm font-black uppercase text-black outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      {AI_MODELS.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.provider})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                      Categoria Inicial
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full p-3 bg-white border-2 border-black text-xs sm:text-sm font-black uppercase text-black outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image Reference Section */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-black stroke-[2.5]" />
                      Imagem de Referência (Opcional)
                    </span>

                    <div className="flex items-center gap-1 bg-white p-0.5 border-2 border-black">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`px-2.5 py-1 text-xs font-black uppercase transition-colors ${
                          imageInputMode === 'upload'
                            ? 'bg-black text-white'
                            : 'text-black hover:bg-gray-100'
                        }`}
                      >
                        Upload Arquivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-2.5 py-1 text-xs font-black uppercase transition-colors ${
                          imageInputMode === 'url'
                            ? 'bg-black text-white'
                            : 'text-black hover:bg-gray-100'
                        }`}
                      >
                        URL Web
                      </button>
                    </div>
                  </div>

                  {imageUrl ? (
                    <div className="relative border-2 border-black bg-white flex items-center justify-between p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={imageUrl}
                          alt="Referência"
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 object-cover border-2 border-black shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-black uppercase truncate">Imagem de referência anexada</p>
                          <p className="text-xs text-gray-500 font-bold truncate max-w-xs">{imageUrl}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1.5 text-black hover:text-rose-600 hover:bg-gray-100 border-2 border-black transition-colors"
                        title="Remover imagem"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : imageInputMode === 'upload' ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-black hover:bg-gray-100 p-6 text-center cursor-pointer bg-white transition-all flex flex-col items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-black" />
                          <span className="text-xs font-black uppercase text-black">Processando imagem...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-black mb-2 stroke-[2.5]" />
                          <p className="text-xs font-black text-black uppercase">
                            Clique ou arraste uma imagem aqui
                          </p>
                          <p className="text-xs text-gray-500 font-bold mt-1 uppercase">
                            Formatos: PNG, JPG, WEBP (isolada do JSON)
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="Cole o link da imagem (ex: https://images.unsplash.com/...)"
                        className="flex-1 p-2.5 bg-white border-2 border-black font-bold text-xs text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3.5 py-2.5 text-xs font-black uppercase text-white bg-black hover:bg-neutral-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
                      >
                        Vincular
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Organize CTA Banner */}
                <div className="p-4 bg-black text-white border-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white text-black border-2 border-black shrink-0">
                      <Sparkles className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        ORGANIZAR COM INTELIGÊNCIA ARTIFICIAL
                      </p>
                      <p className="text-xs text-gray-300 font-medium">
                        O Gemini analisará o texto e imagem para gerar os campos estruturados automaticamente.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeWithAI}
                    disabled={isAnalyzing || !rawPrompt.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-black uppercase text-black bg-white hover:bg-gray-100 disabled:bg-gray-400 disabled:text-gray-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0 min-h-[40px]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>ANALISANDO...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 stroke-[2.5]" />
                        <span>ESTRUTURAR COM IA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Analysis Step Indicator */}
                {isAnalyzing && (
                  <div className="p-3 bg-gray-100 border-2 border-black text-center text-xs font-black uppercase text-black flex items-center justify-center gap-2 animate-pulse shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{analysisStep || 'PROCESSANDO ANÁLISE MULTIMODAL...'}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Review & Edit Structured Tab */
              <div className="space-y-5">
                {/* Title and Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                      Título do Prompt <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Título descritivo"
                      className="w-full p-3 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                      Categoria
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full p-3 bg-white border-2 border-black text-xs sm:text-sm font-black uppercase text-black outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags Editor */}
                <div>
                  <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                    Tags & Palavras-Chave
                  </label>
                  <div className="p-2.5 bg-gray-50 border-2 border-black flex flex-wrap items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs font-black uppercase bg-white text-black px-2.5 py-1 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-black hover:text-rose-600 ml-1"
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1 min-w-[140px] flex-1">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="+ Adicionar tag (Enter)"
                        className="w-full bg-transparent text-xs font-bold text-black placeholder-gray-500 outline-none px-2 py-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Structured Fields Grid */}
                <div className="space-y-4">
                  <span className="block text-xs font-black text-black uppercase tracking-wider">
                    Campos Estruturados Modulares
                  </span>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                      Sujeito Principal (Subject)
                    </label>
                    <input
                      type="text"
                      value={structured.subject}
                      onChange={e => setStructured({ ...structured, subject: e.target.value })}
                      placeholder="Descrição clara do sujeito..."
                      className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>

                  {/* Environment & Lighting */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                        Ambiente / Cenário (Environment)
                      </label>
                      <input
                        type="text"
                        value={structured.environment}
                        onChange={e => setStructured({ ...structured, environment: e.target.value })}
                        placeholder="Localização, clima e atmosfera..."
                        className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                        Iluminação (Lighting)
                      </label>
                      <input
                        type="text"
                        value={structured.lighting}
                        onChange={e => setStructured({ ...structured, lighting: e.target.value })}
                        placeholder="Fontes de luz, direção e contraste..."
                        className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>
                  </div>

                  {/* Camera & Composition */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                        Câmera & Lente (Camera)
                      </label>
                      <input
                        type="text"
                        value={structured.camera}
                        onChange={e => setStructured({ ...structured, camera: e.target.value })}
                        placeholder="Lente (ex: 35mm, 85mm), ângulo..."
                        className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                        Composição & Enquadramento (Composition)
                      </label>
                      <input
                        type="text"
                        value={structured.composition}
                        onChange={e => setStructured({ ...structured, composition: e.target.value })}
                        placeholder="Regra dos terços, simetria, plano..."
                        className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>
                  </div>

                  {/* Style & Colors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                        Estilo & Render (Style)
                      </label>
                      <input
                        type="text"
                        value={structured.style}
                        onChange={e => setStructured({ ...structured, style: e.target.value })}
                        placeholder="Estilo artístico, textura, render..."
                        className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                        Paleta de Cores (Colors)
                      </label>
                      <input
                        type="text"
                        value={structured.colors}
                        onChange={e => setStructured({ ...structured, colors: e.target.value })}
                        placeholder="Tons predominantes e saturação..."
                        className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>
                  </div>

                  {/* Parameters & Aspect Ratio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                        Proporção (Aspect Ratio)
                      </label>
                      <input
                        type="text"
                        value={structured.parameters?.aspectRatio || '16:9'}
                        onChange={e =>
                          setStructured({
                            ...structured,
                            parameters: {
                              ...structured.parameters,
                              aspectRatio: e.target.value,
                            },
                          })
                        }
                        placeholder="16:9, 4:5, 1:1, 9:16..."
                        className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold font-mono text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                        Parâmetros Adicionais (Raw Parameters)
                      </label>
                      <input
                        type="text"
                        value={structured.parameters?.rawParams || ''}
                        onChange={e =>
                          setStructured({
                            ...structured,
                            parameters: {
                              ...structured.parameters,
                              rawParams: e.target.value,
                            },
                          })
                        }
                        placeholder="--v 6.1 --style raw --s 250"
                        className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold font-mono text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>
                  </div>

                  {/* Notes / Internal Tips */}
                  <div>
                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                      Anotações de Uso / Dicas
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Ex: Funciona muito bem no Midjourney com --style raw..."
                      className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Footer Form Controls */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-black">
              {activeTab === 'structure' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('prompt')}
                  className="px-4 py-2 text-xs sm:text-sm font-black uppercase text-black hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors min-h-[40px]"
                >
                  ← VOLTAR
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('structure')}
                  className="px-4 py-2 text-xs sm:text-sm font-black uppercase text-black hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors min-h-[40px]"
                >
                  AVANÇAR →
                </button>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-black uppercase text-black hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors min-h-[40px]"
                >
                  CANCELAR
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !rawPrompt.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-black uppercase text-white bg-black hover:bg-neutral-800 disabled:bg-gray-400 disabled:text-gray-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all min-h-[40px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SALVANDO...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{isEditing ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR E SALVAR'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
