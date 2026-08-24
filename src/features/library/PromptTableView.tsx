import React, { useState } from 'react';
import { PromptItem, Category } from '../../types';
import { AI_MODELS } from '../../data/aiModels';
import { copyToClipboard } from '../../utils/clipboard';
import { compileFullPrompt, formatDate } from '../../utils/formatters';
import { Heart, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface PromptTableViewProps {
  prompts: PromptItem[];
  categories: Category[];
  onSelect: (prompt: PromptItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onCopyIncrement: (id: string) => void;
}

export const PromptTableView: React.FC<PromptTableViewProps> = ({
  prompts,
  categories,
  onSelect,
  onToggleFavorite,
  onCopyIncrement,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleCopy = async (prompt: PromptItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = compileFullPrompt(prompt);
    const success = await copyToClipboard(fullText);
    if (success) {
      setCopiedId(prompt.id);
      onCopyIncrement(prompt.id);
      showToast('Prompt copiado!', 'Texto copiado para a área de transferência.', 'success', 2000);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="w-full overflow-x-auto border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <table className="w-full text-left text-xs sm:text-sm text-black">
        <thead className="bg-black border-b-2 border-black text-white text-xs font-black uppercase tracking-wider">
          <tr>
            <th className="py-3.5 px-4 w-16">REF</th>
            <th className="py-3.5 px-4 min-w-[200px]">TÍTULO & ASSUNTO</th>
            <th className="py-3.5 px-4 hidden md:table-cell min-w-[120px]">MODELO</th>
            <th className="py-3.5 px-4 hidden sm:table-cell min-w-[130px]">CATEGORIA</th>
            <th className="py-3.5 px-4 hidden lg:table-cell">TAGS</th>
            <th className="py-3.5 px-4 hidden xl:table-cell">CRIADO EM</th>
            <th className="py-3.5 px-4 text-right">AÇÕES</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-black">
          {prompts.map(prompt => {
            const model = AI_MODELS.find(m => m.id === prompt.targetModel);
            const category = categories.find(c => c.id === prompt.category);
            const isCopied = copiedId === prompt.id;

            return (
              <tr
                key={prompt.id}
                onClick={() => onSelect(prompt)}
                className="hover:bg-gray-100 cursor-pointer transition-colors group"
              >
                {/* Reference Thumbnail */}
                <td className="py-3 px-4">
                  <div className="w-12 h-12 overflow-hidden bg-gray-200 border-2 border-black shrink-0 flex items-center justify-center">
                    {prompt.image?.url ? (
                      <img
                        src={prompt.image.url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </td>

                {/* Title & Subject */}
                <td className="py-3 px-4">
                  <div className="font-black text-black uppercase tracking-tight group-hover:underline line-clamp-1">
                    {prompt.title}
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide line-clamp-1 mt-0.5">
                    {prompt.structured?.subject || prompt.rawPrompt}
                  </div>
                </td>

                {/* AI Model */}
                <td className="py-3 px-4 hidden md:table-cell">
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase bg-black text-white">
                    {model?.shortName || prompt.targetModel}
                  </span>
                </td>

                {/* Category */}
                <td className="py-3 px-4 hidden sm:table-cell">
                  {category && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase bg-white text-black border border-black">
                      {category.name}
                    </span>
                  )}
                </td>

                {/* Tags */}
                <td className="py-3 px-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {prompt.tags?.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-black uppercase bg-gray-100 text-black px-1.5 py-0.5 border border-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                    {prompt.tags?.length > 2 && (
                      <span className="text-[10px] font-black text-gray-500">+{prompt.tags.length - 2}</span>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td className="py-3 px-4 hidden xl:table-cell text-xs font-bold text-gray-500 uppercase whitespace-nowrap">
                  {formatDate(prompt.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={e => onToggleFavorite(prompt.id, e)}
                      className={`p-1.5 border-2 border-black transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${
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
                      onClick={e => handleCopy(prompt, e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-tight border-2 border-black transition-all min-h-[32px] ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black hover:bg-neutral-800 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span className="hidden sm:inline">COPIADO</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span className="hidden sm:inline">COPIAR</span>
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

