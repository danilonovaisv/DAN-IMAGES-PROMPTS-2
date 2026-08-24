import React, { useState } from 'react';
import { PromptItem, Category } from '../../types';
import { AI_MODELS } from '../../data/aiModels';
import { copyToClipboard } from '../../utils/clipboard';
import { compileFullPrompt, getCategoryBadgeClass } from '../../utils/formatters';
import { Heart, Copy, Check, Layers, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface PromptCardProps {
  prompt: PromptItem;
  categories: Category[];
  onSelect: (prompt: PromptItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTagClick?: (tag: string, e: React.MouseEvent) => void;
  onCopyIncrement: (id: string) => void;
  compact?: boolean;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  categories,
  onSelect,
  onToggleFavorite,
  onTagClick,
  onCopyIncrement,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { showToast } = useToast();

  const model = AI_MODELS.find(m => m.id === prompt.targetModel) || {
    id: prompt.targetModel,
    shortName: prompt.targetModel,
    badgeColor: 'border-2 border-black text-black bg-white font-black uppercase text-[10px]',
  };

  const category = categories.find(c => c.id === prompt.category);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = compileFullPrompt(prompt);
    const success = await copyToClipboard(fullText);
    if (success) {
      setCopied(true);
      onCopyIncrement(prompt.id);
      showToast('Prompt copiado!', 'Texto copiado para a área de transferência.', 'success', 2000);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={() => onSelect(prompt)}
      className="group relative flex flex-col bg-white border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 cursor-pointer overflow-hidden"
    >
      {/* Thumbnail Area */}
      <div className={`relative w-full overflow-hidden bg-gray-200 border-b-2 border-black ${compact ? 'h-36' : 'h-48 sm:h-52'}`}>
        {prompt.image?.url && !imgError ? (
          <img
            src={prompt.image.url}
            alt={prompt.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-100 text-gray-400">
            <ImageIcon className="w-8 h-8 mb-2 opacity-60 text-black" />
            <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wider text-center px-4 line-clamp-2">
              {prompt.structured?.subject || 'Sem imagem de referência'}
            </span>
          </div>
        )}

        {/* Top Badges over Image */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10 pointer-events-none">
          {/* Model Badge */}
          <span
            className="inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] pointer-events-auto"
          >
            {model.shortName}
          </span>

          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={e => onToggleFavorite(prompt.id, e)}
            className={`p-1.5 bg-white border-2 border-black transition-all pointer-events-auto min-h-[32px] min-w-[32px] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              prompt.isFavorite
                ? 'bg-rose-50 text-rose-600'
                : 'text-black hover:text-rose-600'
            }`}
            title={prompt.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={`w-4 h-4 ${prompt.isFavorite ? 'fill-rose-600 text-rose-600' : 'text-black'}`} />
          </button>
        </div>

        {/* Category Pill over bottom of image */}
        {category && (
          <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {category.name}
            </span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div>
          <h3 className="text-base font-black text-black uppercase tracking-tight line-clamp-1 leading-snug group-hover:underline">
            {prompt.title}
          </h3>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide line-clamp-2 mt-1 leading-relaxed">
            {prompt.structured?.subject || prompt.rawPrompt}
          </p>
        </div>

        {/* Structured Tags Preview */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center pt-1">
            {prompt.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                onClick={e => {
                  if (onTagClick) {
                    onTagClick(tag, e);
                  }
                }}
                className="text-[10px] font-black uppercase text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-2 py-0.5 border border-gray-300 hover:border-black transition-colors"
              >
                #{tag}
              </span>
            ))}
            {prompt.tags.length > 3 && (
              <span className="text-[10px] font-black text-gray-400">
                +{prompt.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bottom Card Actions */}
        <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-2 mt-auto">
          <span className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-black" />
            {prompt.copyCount || 0} {prompt.copyCount === 1 ? 'USO' : 'USOS'}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-tight border-2 border-black transition-all min-h-[32px] ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-black hover:bg-neutral-800 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
            }`}
            title="Copiar prompt completo"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>COPIADO</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>COPIAR PROMPT</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

