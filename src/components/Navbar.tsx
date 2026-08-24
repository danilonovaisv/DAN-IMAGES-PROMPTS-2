import React from 'react';
import { Plus, FolderKanban, FolderSync } from 'lucide-react';
import { AppIcon } from './AppIcon';

interface NavbarProps {
  promptCount: number;
  onNewPrompt: () => void;
  onOpenCategories: () => void;
  onOpenWorkspaceImport: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  promptCount,
  onNewPrompt,
  onOpenCategories,
  onOpenWorkspaceImport,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-black bg-white transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3.5 min-w-0">
          <AppIcon size={46} showBorder={true} className="rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-black uppercase leading-none truncate">
                Dan Images Prompts
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[11px] font-black uppercase bg-black text-white rounded-full">
                {promptCount} {promptCount === 1 ? 'PROMPT' : 'PROMPTS'}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest truncate mt-0.5">
              Intelligence Library v.1.0
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenWorkspaceImport}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-black uppercase tracking-tight text-black bg-white hover:bg-gray-100 border-2 border-black transition-colors min-h-[40px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Importar prompts do Google Docs e imagens do Google Drive"
          >
            <FolderSync className="w-4 h-4 text-black stroke-[2.5]" />
            <span className="hidden md:inline">Importar Google Drive</span>
            <span className="md:hidden">Google</span>
          </button>

          <button
            type="button"
            onClick={onOpenCategories}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-black uppercase tracking-tight text-black bg-white hover:bg-gray-100 border-2 border-black transition-colors min-h-[40px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Gerenciar categorias da biblioteca"
          >
            <FolderKanban className="w-4 h-4 text-black" />
            <span className="hidden sm:inline">Categorias</span>
          </button>

          <button
            type="button"
            onClick={onNewPrompt}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 text-xs sm:text-sm font-black uppercase tracking-tight text-white bg-black hover:bg-neutral-800 border-2 border-black transition-all min-h-[40px] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Prompt</span>
          </button>
        </div>
      </div>
    </header>
  );
};

