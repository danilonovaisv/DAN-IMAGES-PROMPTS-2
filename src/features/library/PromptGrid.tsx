import React from 'react';
import { PromptItem, Category } from '../../types';
import { PromptCard } from './PromptCard';
import { Sparkles, SearchX, Plus } from 'lucide-react';

interface PromptGridProps {
  prompts: PromptItem[];
  categories: Category[];
  isLoading: boolean;
  onSelect: (prompt: PromptItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTagClick?: (tag: string, e: React.MouseEvent) => void;
  onCopyIncrement: (id: string) => void;
  onNewPrompt: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  compact?: boolean;
}

export const PromptGrid: React.FC<PromptGridProps> = ({
  prompts,
  categories,
  isLoading,
  onSelect,
  onToggleFavorite,
  onTagClick,
  onCopyIncrement,
  onNewPrompt,
  onClearFilters,
  hasActiveFilters,
  compact = false,
}) => {
  if (isLoading) {
    return (
      <div className={`grid gap-5 sm:gap-6 ${
        compact
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
      }`}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white border-2 border-black overflow-hidden animate-pulse flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className={`w-full bg-gray-200 border-b-2 border-black ${compact ? 'h-36' : 'h-48 sm:h-52'}`} />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 w-3/4" />
              <div className="h-3 bg-gray-200 w-full" />
              <div className="h-3 bg-gray-200 w-1/2" />
              <div className="pt-2 flex justify-between">
                <div className="h-4 bg-gray-200 w-16" />
                <div className="h-8 bg-black w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto flex flex-col items-center border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-16 h-16 bg-black flex items-center justify-center text-white mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {hasActiveFilters ? <SearchX className="w-8 h-8 stroke-[2.5]" /> : <Sparkles className="w-8 h-8 stroke-[2.5]" />}
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight text-black">
          {hasActiveFilters ? 'NENHUM PROMPT ENCONTRADO' : 'BIBLIOTECA VAZIA'}
        </h3>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-2 leading-relaxed">
          {hasActiveFilters
            ? 'Não encontramos nenhum prompt correspondente aos filtros e termos de pesquisa aplicados.'
            : 'Adicione seus prompts, fotos de referência e utilize a IA para organizá-los em uma biblioteca visual estruturada.'}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-4 py-2.5 text-xs font-black uppercase tracking-tight text-black bg-white hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors min-h-[40px]"
            >
              LIMPAR FILTROS
            </button>
          ) : null}

          <button
            type="button"
            onClick={onNewPrompt}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-tight text-white bg-black hover:bg-neutral-800 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all min-h-[40px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>CADASTRAR PRIMEIRO PROMPT</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-5 sm:gap-6 ${
        compact
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {prompts.map(prompt => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          categories={categories}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
          onTagClick={onTagClick}
          onCopyIncrement={onCopyIncrement}
          compact={compact}
        />
      ))}
    </div>
  );
};

