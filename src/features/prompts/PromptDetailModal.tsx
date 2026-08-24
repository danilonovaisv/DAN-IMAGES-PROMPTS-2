import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PromptItem, Category } from '../../types';
import { AI_MODELS } from '../../data/aiModels';
import { copyToClipboard } from '../../utils/clipboard';
import { compileFullPrompt, formatDate } from '../../utils/formatters';
import {
  X,
  Copy,
  Check,
  Heart,
  Edit3,
  CopyPlus,
  Trash2,
  Code2,
  Sparkles,
  Camera,
  Sun,
  Layers,
  Palette,
  Maximize2,
  Sliders,
  Compass,
  FileText,
} from 'lucide-react';
import { useToast } from '../../components/Toast';

interface PromptDetailModalProps {
  prompt: PromptItem | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (prompt: PromptItem) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopyIncrement: (id: string) => void;
  onTagClick?: (tag: string) => void;
  onPreviewImage: (url: string, title?: string) => void;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  prompt,
  categories,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onCopyIncrement,
  onTagClick,
  onPreviewImage,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [showJsonTab, setShowJsonTab] = useState(false);
  const { showToast } = useToast();

  if (!prompt || !isOpen) return null;

  const model = AI_MODELS.find(m => m.id === prompt.targetModel) || {
    id: prompt.targetModel,
    shortName: prompt.targetModel,
    name: prompt.targetModel,
    provider: 'GenAI',
    badgeColor: 'border-2 border-black text-black bg-white font-black uppercase text-[10px]',
  };

  const category = categories.find(c => c.id === prompt.category);
  const fullPromptText = compileFullPrompt(prompt);

  const handleCopyPrompt = async () => {
    const success = await copyToClipboard(fullPromptText);
    if (success) {
      setCopiedPrompt(true);
      onCopyIncrement(prompt.id);
      showToast('Prompt copiado!', 'Texto completo copiado para a área de transferência.', 'success', 2000);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleCopyJSON = async () => {
    const jsonString = JSON.stringify(
      {
        id: prompt.id,
        title: prompt.title,
        targetModel: prompt.targetModel,
        category: category?.name || prompt.category,
        tags: prompt.tags,
        rawPrompt: prompt.rawPrompt,
        structured: prompt.structured,
        imageReference: prompt.image?.url || null,
        createdAt: prompt.createdAt,
      },
      null,
      2
    );
    const success = await copyToClipboard(jsonString);
    if (success) {
      setCopiedJSON(true);
      showToast('JSON copiado!', 'Estrutura JSON completa copiada.', 'success', 2000);
      setTimeout(() => setCopiedJSON(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-4">
              <span className="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-black text-white">
                {model.shortName}
              </span>
              {category && (
                <span className="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-white text-black border-2 border-black">
                  {category.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onToggleFavorite(prompt.id)}
                className={`p-2 border-2 border-black transition-all min-h-[38px] min-w-[38px] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  prompt.isFavorite
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-white text-black hover:text-rose-600'
                }`}
                title={prompt.isFavorite ? 'Remover favorito' : 'Favoritar'}
              >
                <Heart className={`w-4 h-4 ${prompt.isFavorite ? 'fill-rose-600 text-rose-600' : 'text-black'}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-black hover:bg-gray-100 border-2 border-black transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-white">
            {/* Title & Metadata */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight leading-tight">
                {prompt.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">
                <span>Criado em: {formatDate(prompt.createdAt)}</span>
                <span>•</span>
                <span>{prompt.copyCount || 0} utilizações</span>
                {prompt.notes && (
                  <>
                    <span>•</span>
                    <span className="text-black italic">Nota: {prompt.notes}</span>
                  </>
                )}
              </div>
            </div>

            {/* Reference Image Container */}
            {prompt.image?.url && (
              <div className="relative group overflow-hidden border-2 border-black bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <img
                  src={prompt.image.url}
                  alt={prompt.title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[420px] object-cover object-center"
                />
                <button
                  type="button"
                  onClick={() => onPreviewImage(prompt.image!.url, prompt.title)}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase text-white bg-black hover:bg-neutral-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>AMPLIAR IMAGEM</span>
                </button>
              </div>
            )}

            {/* Prompt Actions Bar */}
            <div className="p-4 bg-gray-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-black stroke-[2.5]" />
                  <span className="text-xs font-black text-black uppercase tracking-wider">
                    Prompt Completo Formatado
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowJsonTab(!showJsonTab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase text-black bg-white hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors min-h-[36px]"
                  >
                    <Code2 className="w-3.5 h-3.5 text-black" />
                    <span>{showJsonTab ? 'OCULTAR JSON' : 'VER JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase text-black bg-white hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors min-h-[36px]"
                  >
                    {copiedJSON ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span>JSON COPIADO</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                        <span>COPIAR JSON</span>
                      </>
                    )}
                  </button>

                  {/* Primary Highlighted Action: Copiar Prompt */}
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-black uppercase text-white bg-black hover:bg-neutral-800 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all min-h-[36px]"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                        <span>PROMPT COPIADO!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 stroke-[2.5]" />
                        <span>COPIAR PROMPT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {showJsonTab ? (
                <pre className="p-3 bg-white border-2 border-black text-xs text-black font-mono overflow-x-auto leading-relaxed max-h-64">
                  {JSON.stringify(
                    {
                      id: prompt.id,
                      title: prompt.title,
                      targetModel: prompt.targetModel,
                      category: prompt.category,
                      tags: prompt.tags,
                      rawPrompt: prompt.rawPrompt,
                      structured: prompt.structured,
                      createdAt: prompt.createdAt,
                    },
                    null,
                    2
                  )}
                </pre>
              ) : (
                <div className="p-3.5 bg-white border-2 border-black text-sm text-black font-bold select-all leading-relaxed whitespace-pre-wrap">
                  {fullPromptText}
                </div>
              )}
            </div>

            {/* Tags Section */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div>
                <span className="text-xs font-black text-black uppercase tracking-wider block mb-2">
                  Tags & Categorização
                </span>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (onTagClick) {
                          onClose();
                          onTagClick(tag);
                        }
                      }}
                      className="text-xs font-black uppercase text-black hover:bg-black hover:text-white bg-gray-100 px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Prompt Breakdown Grid */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
                <h3 className="text-sm font-black text-black uppercase tracking-wider">
                  Estrutura Analisada do Prompt
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Subject */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    Sujeito Principal (Subject)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                    {prompt.structured.subject || 'Não especificado'}
                  </p>
                </div>

                {/* Environment */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-black" />
                    Ambiente & Cenário (Environment)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                    {prompt.structured.environment || 'Não especificado'}
                  </p>
                </div>

                {/* Lighting */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-black" />
                    Iluminação & Luz (Lighting)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                    {prompt.structured.lighting || 'Não especificado'}
                  </p>
                </div>

                {/* Camera */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-black" />
                    Câmera, Lente & Ângulo (Camera)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                    {prompt.structured.camera || 'Não especificado'}
                  </p>
                </div>

                {/* Composition */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-black" />
                    Composição & Enquadramento (Composition)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                    {prompt.structured.composition || 'Não especificado'}
                  </p>
                </div>

                {/* Style */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-black" />
                    Estilo Artístico & Render (Style)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                    {prompt.structured.style || 'Não especificado'}
                  </p>
                </div>

                {/* Colors */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-black" />
                    Paleta de Cores & Tons (Colors)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                    {prompt.structured.colors || 'Não especificado'}
                  </p>
                </div>

                {/* Parameters & Instructions */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-black" />
                    Parâmetros & Instruções
                  </span>
                  <div className="text-xs font-bold text-gray-800 space-y-1">
                    {prompt.structured.parameters?.aspectRatio && (
                      <div>Proporção: <span className="text-black font-black">--ar {prompt.structured.parameters.aspectRatio}</span></div>
                    )}
                    {prompt.structured.parameters?.negativePrompt && (
                      <div>Negativo: <span className="text-gray-600 italic">{prompt.structured.parameters.negativePrompt}</span></div>
                    )}
                    {prompt.structured.instructions && (
                      <div>Nota: <span className="text-gray-600">{prompt.structured.instructions}</span></div>
                    )}
                    {prompt.structured.parameters?.rawParams && (
                      <div className="font-mono text-black font-black">{prompt.structured.parameters.rawParams}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between px-5 py-4 border-t-2 border-black bg-white shrink-0 gap-3">
            <button
              type="button"
              onClick={() => onDelete(prompt.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-black uppercase text-rose-600 hover:bg-rose-50 border-2 border-rose-600 shadow-[2px_2px_0px_0px_rgba(225,29,72,1)] transition-colors min-h-[40px]"
            >
              <Trash2 className="w-4 h-4" />
              <span>EXCLUIR</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDuplicate(prompt.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black uppercase text-black bg-white hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors min-h-[40px]"
                title="Duplicar prompt para criar variações"
              >
                <CopyPlus className="w-4 h-4" />
                <span>DUPLICAR</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(prompt)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black uppercase text-white bg-black hover:bg-neutral-800 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] transition-all min-h-[40px]"
              >
                <Edit3 className="w-4 h-4" />
                <span>EDITAR</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

