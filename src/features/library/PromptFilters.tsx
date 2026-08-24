import React from 'react';
import { Category, FilterState, ViewMode, SortOption, AIModel } from '../../types';
import { AI_MODELS } from '../../data/aiModels';
import {
  Heart,
  Clock,
  Sparkles,
  LayoutGrid,
  Grid,
  List,
} from 'lucide-react';

interface PromptFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
  favoriteCount: number;
}

export const PromptFilters: React.FC<PromptFiltersProps> = ({
  categories,
  filters,
  onFilterChange,
  categoryCounts,
  totalCount,
  favoriteCount,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Bar: Quick Tabs & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-4">
        {/* Quick Tabs: Todos / Favoritos / Recentes */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => onFilterChange({ onlyFavorites: false, sortBy: 'newest' })}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-tight rounded-full transition-all whitespace-nowrap min-h-[32px] ${
              !filters.onlyFavorites && filters.sortBy === 'newest'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-black hover:text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>TODOS ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange({ onlyFavorites: true })}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-tight rounded-full transition-all whitespace-nowrap min-h-[32px] ${
              filters.onlyFavorites
                ? 'bg-rose-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-black hover:text-black'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${filters.onlyFavorites ? 'fill-white text-white' : 'text-gray-500'}`} />
            <span>FAVORITOS ({favoriteCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange({ sortBy: 'newest', onlyFavorites: false })}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-tight rounded-full transition-all whitespace-nowrap min-h-[32px] ${
              filters.sortBy === 'newest' && !filters.onlyFavorites
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-black hover:text-black'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>RECENTES</span>
          </button>
        </div>

        {/* Right side: Model filter, Sorting & View Mode */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Target Model Filter */}
          <div className="relative">
            <select
              value={filters.model}
              onChange={e => onFilterChange({ model: e.target.value })}
              className="px-3 py-1.5 text-xs font-black uppercase bg-white border-2 border-black text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black min-h-[36px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              aria-label="Filtrar por modelo de IA"
            >
              <option value="all">MODELO: TODOS</option>
              {AI_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.shortName.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={e => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="px-3 py-1.5 text-xs font-black uppercase bg-white border-2 border-black text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black min-h-[36px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              aria-label="Ordenar biblioteca"
            >
              <option value="newest">ORDEM: MAIS RECENTES</option>
              <option value="copies">ORDEM: MAIS COPIADOS</option>
              <option value="az">ORDEM: ALFABÉTICA (A-Z)</option>
              <option value="oldest">ORDEM: MAIS ANTIGOS</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'grid' })}
              className={`p-1.5 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${
                filters.viewMode === 'grid'
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-black'
              }`}
              title="Visualização em Grade Visual"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'compact' })}
              className={`p-1.5 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center border-l border-r border-black ${
                filters.viewMode === 'compact'
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-black'
              }`}
              title="Visualização Compacta"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'table' })}
              className={`p-1.5 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${
                filters.viewMode === 'table'
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-black'
              }`}
              title="Visualização em Tabela / Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills (Horizontal scrolling) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => onFilterChange({ category: 'all' })}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black uppercase tracking-tight rounded-full transition-all whitespace-nowrap min-h-[34px] ${
            filters.category === 'all'
              ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]'
              : 'bg-white border border-gray-300 text-gray-600 hover:border-black hover:text-black'
          }`}
        >
          <span>ALL</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            filters.category === 'all' ? 'bg-white text-black' : 'bg-gray-200 text-gray-700'
          }`}>
            {totalCount}
          </span>
        </button>

        {categories.map(cat => {
          const count = categoryCounts[cat.id] || 0;
          const isSelected = filters.category === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onFilterChange({ category: isSelected ? 'all' : cat.id })}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black uppercase tracking-tight rounded-full transition-all whitespace-nowrap min-h-[34px] ${
                isSelected
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]'
                  : 'bg-white border border-gray-300 text-gray-600 hover:border-black hover:text-black'
              }`}
            >
              <span>{cat.name}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-white text-black' : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

