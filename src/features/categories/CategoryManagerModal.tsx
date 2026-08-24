import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Category } from '../../types';
import { ApiService } from '../../services/api';
import { useToast } from '../../components/Toast';
import { getCategoryBadgeClass } from '../../utils/formatters';
import {
  X,
  Plus,
  Trash2,
  FolderKanban,
  Lock,
} from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: Category[];
  categoryCounts: Record<string, number>;
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

const COLOR_OPTIONS = [
  { id: 'indigo', label: 'Índigo' },
  { id: 'emerald', label: 'Esmeralda' },
  { id: 'amber', label: 'Âmbar' },
  { id: 'purple', label: 'Púrpura' },
  { id: 'cyan', label: 'Ciano' },
  { id: 'rose', label: 'Rosa' },
  { id: 'teal', label: 'Teal' },
  { id: 'pink', label: 'Pink' },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
  categoryCounts,
  onClose,
  onCategoriesUpdated,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('indigo');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsSubmitting(true);
    try {
      await ApiService.createCategory({
        name: newCatName.trim(),
        slug: newCatName.trim().toLowerCase().replace(/\s+/g, '-'),
        icon: 'Tag',
        color: newCatColor,
        description: newCatDesc.trim(),
      });

      setNewCatName('');
      setNewCatDesc('');
      showToast('Categoria criada!', 'Nova categoria adicionada à biblioteca.', 'success');
      onCategoriesUpdated();
    } catch (err: any) {
      showToast('Erro ao criar', err.message || 'Falha ao criar categoria', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, isSystem?: boolean) => {
    if (isSystem) {
      showToast('Ação não permitida', 'Categorias padrão do sistema não podem ser excluídas.', 'info');
      return;
    }

    try {
      await ApiService.deleteCategory(id);
      showToast('Categoria excluída', 'A categoria foi removida com sucesso.', 'success');
      onCategoriesUpdated();
    } catch (err: any) {
      showToast('Erro ao excluir', err.message || 'Não foi possível excluir a categoria', 'error');
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
          className="relative w-full max-w-2xl bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-black text-white border-2 border-black">
                <FolderKanban className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  GERENCIAR CATEGORIAS
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Organize seus prompts por nichos visuais personalizados
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

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-white">
            {/* Create New Category Form */}
            <form onSubmit={handleCreateCategory} className="p-4 bg-gray-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <span className="text-xs font-black text-black uppercase tracking-wider block">
                CRIAR NOVA CATEGORIA
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                    Nome da Categoria
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Ex: Macro Photography, Anime..."
                    className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                    Cor de Destaque
                  </label>
                  <select
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-black uppercase text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {COLOR_OPTIONS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Finalidade desta categoria..."
                  className="w-full p-2.5 bg-white border-2 border-black text-xs sm:text-sm font-bold text-black outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newCatName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-black uppercase text-white bg-black hover:bg-neutral-800 disabled:bg-gray-400 disabled:text-gray-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all min-h-[38px]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>ADICIONAR CATEGORIA</span>
                </button>
              </div>
            </form>

            {/* List of Existing Categories */}
            <div className="space-y-3">
              <span className="text-xs font-black text-black uppercase tracking-wider block">
                CATEGORIAS EXISTENTES ({categories.length})
              </span>

              <div className="divide-y-2 divide-black border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {categories.map(cat => {
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`px-2.5 py-1 text-xs font-black uppercase border-2 ${getCategoryBadgeClass(
                            cat.color
                          )}`}
                        >
                          {cat.name}
                        </span>
                        <div className="min-w-0">
                          {cat.description && (
                            <p className="text-xs font-medium text-gray-600 truncate hidden sm:block">
                              {cat.description}
                            </p>
                          )}
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            {count} {count === 1 ? 'PROMPT' : 'PROMPTS'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {cat.isSystem ? (
                          <span
                            className="p-1.5 text-gray-500 text-xs font-black uppercase flex items-center gap-1 border-2 border-gray-300 bg-gray-100"
                            title="Categoria padrão do sistema"
                          >
                            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span className="hidden sm:inline text-[10px]">SISTEMA</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.isSystem)}
                            className="p-1.5 text-black hover:text-white hover:bg-black border-2 border-black transition-colors"
                            title="Excluir categoria"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-5 py-4 border-t-2 border-black bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs sm:text-sm font-black uppercase text-black hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors min-h-[38px]"
            >
              CONCLUIR
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
