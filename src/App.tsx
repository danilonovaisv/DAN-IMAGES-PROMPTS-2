import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PromptItem, Category, FilterState } from './types';
import { ApiService } from './services/api';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { SearchBar } from './features/search/SearchBar';
import { PromptFilters } from './features/library/PromptFilters';
import { PromptGrid } from './features/library/PromptGrid';
import { PromptTableView } from './features/library/PromptTableView';
import { PromptDetailModal } from './features/prompts/PromptDetailModal';
import { PromptFormModal } from './features/prompts/PromptFormModal';
import { CategoryManagerModal } from './features/categories/CategoryManagerModal';
import { WorkspaceImportModal } from './features/workspace/WorkspaceImportModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { AppIcon } from './components/AppIcon';
import { Sparkles, RotateCcw, AlertTriangle } from 'lucide-react';

function AppContent() {
  const { showToast } = useToast();

  // Data State
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    model: 'all',
    tag: undefined,
    onlyFavorites: false,
    sortBy: 'newest',
    viewMode: 'grid',
  });

  // Modal States
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialPrompt, setFormInitialPrompt] = useState<PromptItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title?: string } | null>(null);
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Load Categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await ApiService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
    }
  }, []);

  // Load Prompts
  const loadPrompts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getPrompts({
        search: filters.search,
        category: filters.category,
        model: filters.model,
        tag: filters.tag,
        favorites: filters.onlyFavorites,
        sortBy: filters.sortBy,
      });
      setPrompts(data);
    } catch (err: any) {
      console.error('Erro ao buscar prompts:', err);
      showToast('Erro de Conexão', 'Não foi possível carregar a biblioteca de prompts.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Compute category counts from total prompts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of prompts) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [prompts]);

  const favoriteCount = useMemo(() => {
    return prompts.filter(p => p.isFavorite).length;
  }, [prompts]);

  // Handlers for Prompt Actions
  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await ApiService.toggleFavorite(id);
      setPrompts(prev => prev.map(p => (p.id === id ? updated : p)));
      if (selectedPrompt && selectedPrompt.id === id) {
        setSelectedPrompt(updated);
      }
      showToast(
        updated.isFavorite ? 'Adicionado aos Favoritos' : 'Removido dos Favoritos',
        undefined,
        'info',
        1800
      );
    } catch (err: any) {
      showToast('Erro', err.message || 'Falha ao favoritar prompt', 'error');
    }
  };

  const handleCopyIncrement = async (id: string) => {
    try {
      const updated = await ApiService.copyPrompt(id);
      setPrompts(prev => prev.map(p => (p.id === id ? updated : p)));
      if (selectedPrompt && selectedPrompt.id === id) {
        setSelectedPrompt(updated);
      }
    } catch (err) {
      console.error('Falha ao registrar incremento de cópia:', err);
    }
  };

  const handleDuplicatePrompt = async (id: string) => {
    try {
      const duplicated = await ApiService.duplicatePrompt(id);
      setPrompts(prev => [duplicated, ...prev]);
      if (selectedPrompt) {
        setSelectedPrompt(null);
      }
      showToast('Prompt duplicado!', 'Uma cópia foi adicionada à biblioteca.', 'success');
    } catch (err: any) {
      showToast('Erro ao duplicar', err.message || 'Falha ao duplicar prompt', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletePromptId) return;
    try {
      await ApiService.deletePrompt(deletePromptId);
      setPrompts(prev => prev.filter(p => p.id !== deletePromptId));
      if (selectedPrompt && selectedPrompt.id === deletePromptId) {
        setSelectedPrompt(null);
      }
      showToast('Prompt excluído', 'O item foi removido da sua biblioteca.', 'success');
    } catch (err: any) {
      showToast('Erro ao excluir', err.message || 'Não foi possível excluir', 'error');
    } finally {
      setDeletePromptId(null);
    }
  };

  const handleResetDataConfirm = async () => {
    try {
      await ApiService.resetData();
      await loadCategories();
      await loadPrompts();
      setIsResetDialogOpen(false);
      showToast('Biblioteca Restaurada', 'Os exemplos padrões foram recarregados.', 'success');
    } catch (err: any) {
      showToast('Erro ao restaurar', err.message, 'error');
    }
  };

  const handleOpenNewPromptModal = () => {
    setFormInitialPrompt(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (prompt: PromptItem) => {
    setSelectedPrompt(null);
    setFormInitialPrompt(prompt);
    setIsFormOpen(true);
  };

  const handlePromptSaved = (savedPrompt: PromptItem) => {
    setPrompts(prev => {
      const exists = prev.some(p => p.id === savedPrompt.id);
      if (exists) {
        return prev.map(p => (p.id === savedPrompt.id ? savedPrompt : p));
      }
      return [savedPrompt, ...prev];
    });
  };

  const handleTagClick = (tag: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFilters(prev => ({ ...prev, tag }));
  };

  const handleFilterUpdate = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      model: 'all',
      tag: undefined,
      onlyFavorites: false,
      sortBy: 'newest',
      viewMode: filters.viewMode,
    });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.category !== 'all' ||
    filters.model !== 'all' ||
    filters.tag !== undefined ||
    filters.onlyFavorites;

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Top Navigation */}
      <Navbar
        promptCount={prompts.length}
        onNewPrompt={handleOpenNewPromptModal}
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        onOpenWorkspaceImport={() => setIsWorkspaceModalOpen(true)}
        onResetData={() => setIsResetDialogOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Visual Search Section */}
        <section className="space-y-4">
          <SearchBar
            value={filters.search}
            onChange={val => handleFilterUpdate({ search: val })}
            onClear={() => handleFilterUpdate({ search: '' })}
            activeTag={filters.tag}
            onClearTag={() => handleFilterUpdate({ tag: undefined })}
          />

          {/* Filtering Bar */}
          <PromptFilters
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterUpdate}
            categoryCounts={categoryCounts}
            totalCount={prompts.length}
            favoriteCount={favoriteCount}
          />
        </section>

        {/* Content View Modes */}
        <section className="pt-2">
          {filters.viewMode === 'table' ? (
            <PromptTableView
              prompts={prompts}
              categories={categories}
              onSelect={p => setSelectedPrompt(p)}
              onToggleFavorite={handleToggleFavorite}
              onCopyIncrement={handleCopyIncrement}
            />
          ) : (
            <PromptGrid
              prompts={prompts}
              categories={categories}
              isLoading={isLoading}
              onSelect={p => setSelectedPrompt(p)}
              onToggleFavorite={handleToggleFavorite}
              onTagClick={handleTagClick}
              onCopyIncrement={handleCopyIncrement}
              onNewPrompt={handleOpenNewPromptModal}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              compact={filters.viewMode === 'compact'}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-600">
          <div className="flex items-center gap-3">
            <AppIcon size={32} showBorder={true} className="rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-black text-black uppercase tracking-wider">DAN IMAGES PROMPTS</span>
              <span className="hidden sm:inline">—</span>
              <span className="uppercase text-gray-500">Biblioteca visual inteligente de prompts para geração de imagens por IA</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsResetDialogOpen(true)}
              className="flex items-center gap-1.5 text-black hover:bg-black hover:text-white px-3 py-1.5 border-2 border-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase text-xs font-black"
              title="Restaurar banco para os prompts iniciais de exemplo"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Restaurar Padrões</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      <PromptDetailModal
        prompt={selectedPrompt}
        categories={categories}
        isOpen={!!selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        onEdit={handleOpenEditModal}
        onDuplicate={handleDuplicatePrompt}
        onDelete={id => setDeletePromptId(id)}
        onToggleFavorite={handleToggleFavorite}
        onCopyIncrement={handleCopyIncrement}
        onTagClick={tag => handleFilterUpdate({ tag })}
        onPreviewImage={(url, title) => setPreviewImage({ url, title })}
      />

      {/* Create / Edit Form Modal */}
      <PromptFormModal
        isOpen={isFormOpen}
        initialPrompt={formInitialPrompt}
        categories={categories}
        onClose={() => setIsFormOpen(false)}
        onSaved={handlePromptSaved}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        categoryCounts={categoryCounts}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesUpdated={loadCategories}
      />

      {/* Workspace Google Docs & Drive Import Modal */}
      <WorkspaceImportModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onImportSuccess={() => {
          loadPrompts();
          loadCategories();
        }}
      />

      {/* Image Lightbox Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletePromptId}
        title="Excluir Prompt da Biblioteca"
        description="Tem certeza que deseja excluir permanentemente este prompt? Esta ação não poderá ser desfeita."
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletePromptId(null)}
      />

      {/* Reset Data Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="Restaurar Banco de Prompts Padrão"
        description="Esta ação restaurará a biblioteca com a coleção curada de prompts fotográficos, cinematográficos, arquitetônicos e conceituais de alta qualidade. Deseja prosseguir?"
        confirmLabel="Restaurar Padrões"
        cancelLabel="Cancelar"
        isDestructive={false}
        onConfirm={handleResetDataConfirm}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
