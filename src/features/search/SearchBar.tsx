import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  activeTag?: string;
  onClearTag?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  activeTag,
  onClearTag,
}) => {
  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-black pointer-events-none">
          <Search className="w-5 h-5 stroke-[2.5]" />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="SEARCH PROMPTS, SUBJECT, LIGHTING, CAMERA, TAGS..."
          className="w-full pl-12 pr-12 py-3.5 text-sm font-bold tracking-tight bg-gray-100 hover:bg-gray-100/90 focus:bg-white border-2 border-black text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all min-h-[48px] uppercase"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1.5 text-black hover:bg-gray-200 border border-black rounded-none transition-colors"
            title="Limpar busca"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {activeTag && (
        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Filtrando por:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase bg-black text-white rounded-full">
            #{activeTag}
            <button
              type="button"
              onClick={onClearTag}
              className="text-gray-300 hover:text-white ml-0.5"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </span>
        </div>
      )}
    </div>
  );
};

