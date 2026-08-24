export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Data desconhecida';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getCategoryBadgeClass(colorName: string): string {
  switch (colorName) {
    case 'emerald':
      return 'bg-emerald-50 text-emerald-900 border border-emerald-500 font-bold uppercase text-[10px]';
    case 'indigo':
      return 'bg-indigo-50 text-indigo-900 border border-indigo-500 font-bold uppercase text-[10px]';
    case 'amber':
      return 'bg-amber-50 text-amber-900 border border-amber-500 font-bold uppercase text-[10px]';
    case 'purple':
      return 'bg-purple-50 text-purple-900 border border-purple-500 font-bold uppercase text-[10px]';
    case 'cyan':
      return 'bg-cyan-50 text-cyan-900 border border-cyan-500 font-bold uppercase text-[10px]';
    case 'rose':
      return 'bg-rose-50 text-rose-900 border border-rose-500 font-bold uppercase text-[10px]';
    case 'teal':
      return 'bg-teal-50 text-teal-900 border border-teal-500 font-bold uppercase text-[10px]';
    case 'pink':
      return 'bg-pink-50 text-pink-900 border border-pink-500 font-bold uppercase text-[10px]';
    default:
      return 'bg-gray-100 text-black border border-black font-bold uppercase text-[10px]';
  }
}

export function compileFullPrompt(item: {
  rawPrompt: string;
  structured?: {
    subject?: string;
    environment?: string;
    lighting?: string;
    camera?: string;
    composition?: string;
    style?: string;
    colors?: string;
    instructions?: string;
    parameters?: {
      aspectRatio?: string;
      stylize?: string | number;
      seed?: string | number;
      negativePrompt?: string;
      cfgScale?: string | number;
      rawParams?: string;
    };
  };
}): string {
  if (item.rawPrompt && item.rawPrompt.trim().length > 0) {
    return item.rawPrompt.trim();
  }

  if (!item.structured) return '';

  const { subject, environment, lighting, camera, composition, style, colors, parameters } = item.structured;
  const parts = [subject, environment, lighting, camera, composition, style, colors].filter(Boolean);
  let result = parts.join(', ');

  if (parameters?.rawParams) {
    result += ` ${parameters.rawParams}`;
  } else if (parameters?.aspectRatio) {
    result += ` --ar ${parameters.aspectRatio}`;
  }

  return result;
}
