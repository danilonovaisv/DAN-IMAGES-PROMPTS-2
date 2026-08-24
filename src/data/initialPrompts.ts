import { PromptItem } from '../types';

export const INITIAL_PROMPTS: PromptItem[] = [
  {
    id: 'prompt-1',
    title: 'Retrato Cibernético em Luz Neon de Tóquio',
    rawPrompt: 'Cinematic portrait of a futuristic cyber-enhanced nomad woman standing in a rainy alley in Shinjuku Tokyo, neon light reflections on wet pavement, volumetric magenta and cyan fog, shot on 35mm anamorphic lens, shallow depth of field, photorealistic skin texture with subtle micro-circuitry --ar 16:9 --v 6.1 --style raw',
    targetModel: 'midjourney-v6',
    category: 'cat-cinematic',
    tags: ['Cyberpunk', 'Retrato', 'Neon', 'Tóquio', 'Cinemático', 'Anamórfico', 'Fotorrealismo'],
    image: {
      url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
      storageType: 'sample',
      aspectRatio: '16:9',
      alt: 'Retrato cibernético com iluminação neon'
    },
    structured: {
      subject: 'Mulher nômade cibernética com detalhes de microcircuitos faciais sutis e olhar expressivo',
      environment: 'Beco estreito e chuvoso em Shinjuku, Tóquio, com poças d\'água reflexivas e névoa atmosférica',
      lighting: 'Iluminação volumétrica dramática em tons de magenta e ciano, reflexos neon brilhantes no asfalto molhado',
      camera: 'Lente anamórfica de 35mm, abertura f/1.4, profundidade de campo rasa com bokeh suave ao fundo',
      composition: 'Plano médio em enquadramento cinematográfico na proporção 16:9, foco preciso nos olhos',
      style: 'Cinematografia sci-fi realista, textura de película 35mm, gradação de cor Blade Runner',
      colors: 'Contraste entre ciano elétrico, magenta profundo, sombras escuras e toques de âmbar',
      instructions: 'Evitar estética excessivamente cartunesca ou pele plastificada.',
      parameters: {
        aspectRatio: '16:9',
        stylize: 250,
        rawParams: '--ar 16:9 --v 6.1 --style raw',
      }
    },
    isFavorite: true,
    copyCount: 42,
    notes: 'Excelente consistência em Midjourney v6.1 com o modificador `--style raw`.',
    createdAt: '2026-08-20T14:30:00.000Z',
    updatedAt: '2026-08-22T10:15:00.000Z',
  },
  {
    id: 'prompt-2',
    title: 'Villa Brutalista Minimalista sobre Fiorde Nórdico',
    rawPrompt: 'High-end architectural photography of a minimalist raw concrete brutalist villa cantilevered dramatically over a stormy Norwegian fjord, floor-to-ceiling glass windows showing warm interior light, misty cold morning atmosphere, diffused ambient light, hyper-detailed architectural details, Hasselblad H6D-100c',
    targetModel: 'flux-1-pro',
    category: 'cat-architecture',
    tags: ['Arquitetura', 'Brutalismo', 'Design Nórdico', 'Minimalismo', 'Fiorde', 'Hasselblad'],
    image: {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      storageType: 'sample',
      aspectRatio: '16:9',
      alt: 'Villa brutalista em concreto e vidro'
    },
    structured: {
      subject: 'Residência brutalista em balanço estrutural arrojado com concreto aparente e painéis de vidro contínuos',
      environment: 'Penhasco rochoso sobre fiorde norueguês nebuloso, águas escuras e vegetação rasteira nórdica',
      lighting: 'Luz matinal fria e difusa de dia nublado, com contraste acolhedor da iluminação interna de 3000K',
      camera: 'Câmera de médio formato Hasselblad H6D-100c, lente grande angular 24mm com correção de perspectiva vertical',
      composition: 'Visão de ângulo baixo enfatizando o balanço estrutural, linhas diagonais fortes e horizonte limpo',
      style: 'Fotografia de revista de arquitetura contemporânea de alto padrão (tipo ArchDaily / Dezeen)',
      colors: 'Paleta neutra com cinzas do concreto, verdes musgo, azul-petróleo do mar e âmbar suave no interior',
      instructions: 'Preservar as linhas retas e a textura granulada do concreto descofrado.',
      parameters: {
        aspectRatio: '16:9',
      }
    },
    isFavorite: true,
    copyCount: 28,
    notes: 'Flux 1.1 Pro entrega reflexos no vidro e texturas de concreto perfeitos sem artefatos.',
    createdAt: '2026-08-19T09:20:00.000Z',
    updatedAt: '2026-08-21T18:40:00.000Z',
  },
  {
    id: 'prompt-3',
    title: 'Fotografia Macro de Vidro de Perfume com Flores Botânicas',
    rawPrompt: 'Commercial studio product shot of a luxury minimalist perfume glass flacon sitting on textured wet black volcanic stone, delicate floating orchid petals and dewdrops, high-speed splash water droplets, rim lighting, soft box gradient background, 100mm macro lens, ultra-sharp focus',
    targetModel: 'flux-1-pro',
    category: 'cat-product',
    tags: ['Produto', 'Perfume', 'Macro', 'Luz de Estúdio', 'Comercial', 'Water Splash'],
    image: {
      url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80',
      storageType: 'sample',
      aspectRatio: '4:3',
      alt: 'Frasco de perfume com gotas e pétalas'
    },
    structured: {
      subject: 'Frasco de vidro de perfume lapidado com líquido dourado translúcido e tampa metálica polida',
      environment: 'Pedra vulcânica negra texturizada com microgotículas de orvalho e pétalas de orquídea flutuantes',
      lighting: 'Iluminação de estúdio comercial com duas softboxes laterais e luz de recorte (rim light) destacando a silhueta do frasco',
      camera: 'Lente macro 100mm f/2.8, foco cravado no logotipo e nas gotas de água, abertura suave',
      composition: 'Enquadramento central simétrico com espaço negativo sofisticado ao redor',
      style: 'Fotografia publicitária de luxo para campanha de beleza e cosméticos de alto padrão',
      colors: 'Preto obsidiana, dourado champanhe, transparência cristalina e toques de rosa orquídea',
      instructions: 'Garantir cáusticas de refração realistas através do vidro.',
      parameters: {
        aspectRatio: '4:3',
      }
    },
    isFavorite: false,
    copyCount: 19,
    notes: 'Excelente para catálogos e marcas de cosméticos.',
    createdAt: '2026-08-18T16:10:00.000Z',
    updatedAt: '2026-08-18T16:10:00.000Z',
  },
  {
    id: 'prompt-4',
    title: 'Guardião Antigo da Floresta Encantada',
    rawPrompt: 'Ethereal fantasy character concept art of an ancient colossal forest guardian covered in glowing bioluminescent moss, carrying a lantern of starlight, towering ancient redwood trees with sunbeams breaking through mist, painterly cinematic style, Studio Ghibli meets Magic the Gathering --ar 16:9 --v 6.1',
    targetModel: 'midjourney-v6',
    category: 'cat-character',
    tags: ['Fantasia', 'Concept Art', 'Bioluminescência', 'Guardião', 'Floresta', 'Ghibli'],
    image: {
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      storageType: 'sample',
      aspectRatio: '16:9',
      alt: 'Arte de guardião da floresta'
    },
    structured: {
      subject: 'Criatura ancestral imensa feita de madeira e pedra antiga, revestida por musgo bioluminescente',
      environment: 'Floresta primordial de sequoias gigantes com névoa mística e raios crepusculares',
      lighting: 'Brilho suave azul/verde da bioluminescência contrastando com raios solares dourados volumétricos',
      camera: 'Ângulo contra-plongée (baixo para cima) para transmitir a escala monumental do guardião',
      composition: 'Regra dos terços com o guardião à direita e a luz mística guiando o olhar pelo centro',
      style: 'Pintura conceitual digital com acabamento cinematográfico detalhado',
      colors: 'Verde esmeralda, azul cobalto bioluminescente, tons terrosos e dourado solar',
      instructions: 'Manter a sensação de serenidade e antiguidade, sem torná-lo monstruoso.',
      parameters: {
        aspectRatio: '16:9',
        stylize: 300,
        rawParams: '--ar 16:9 --v 6.1',
      }
    },
    isFavorite: true,
    copyCount: 35,
    notes: 'Combina muito bem atmosfera de fantasia com iluminação mística.',
    createdAt: '2026-08-15T11:00:00.000Z',
    updatedAt: '2026-08-20T08:00:00.000Z',
  },
  {
    id: 'prompt-5',
    title: 'Retrato Editorial de Moda em Alta Costura Monocromática',
    rawPrompt: 'Vogue editorial studio portrait of a high-fashion model wearing an avant-garde sculptural origami silk dress, dramatic directional shadow, high contrast chiaroscuro lighting, minimalist warm grey studio background, captured on 85mm medium format, raw authentic film grain',
    targetModel: 'imagen-3',
    category: 'cat-editorial',
    tags: ['Moda', 'Editorial', 'Vogue', 'Chiaroscuro', 'Alta Costura', 'Origami'],
    image: {
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
      storageType: 'sample',
      aspectRatio: '4:5',
      alt: 'Modelo em vestido escultural de alta costura'
    },
    structured: {
      subject: 'Modelo de alta moda com pose escultural dinâmica vestindo seda estruturada com dobras inspiradas em origami',
      environment: 'Estúdio fotográfico contemporâneo com ciclorama cinza quente e sombras geométricas nítidas',
      lighting: 'Luz direcional forte tipo Fresnel (chiaroscuro), criando sombras recortadas e brilho nos tecidos',
      camera: 'Lente retrato 85mm f/2.0 em sensor médio formato, foco agudo nos olhos e textura do tecido',
      composition: 'Enquadramento vertical editorial 4:5, proporções equilibradas com silhueta marcante',
      style: 'Fotografia editorial da Vogue / Harper\'s Bazaar com granulação fina orgânica',
      colors: 'Monocromático com variações de marfim, carvão, cinza ardósia e tons de pele naturais',
      instructions: 'Evitar suavização digital excessiva na pele; manter poros e textura têxtil autênticos.',
      parameters: {
        aspectRatio: '4:5',
      }
    },
    isFavorite: false,
    copyCount: 14,
    notes: 'Excelente para lookbooks e referências de styling.',
    createdAt: '2026-08-12T19:45:00.000Z',
    updatedAt: '2026-08-14T10:30:00.000Z',
  },
  {
    id: 'prompt-6',
    title: 'Aurora Boreal Refletida em Lago Glacial na Islândia',
    rawPrompt: 'National Geographic style long-exposure landscape of vibrant emerald and violet Northern Lights swirling over the diamond beach of Jokulsarlon Iceland, crystal clear icebergs glowing on black volcanic sand, stars clearly visible in dark night sky, crisp foreground reflections, ultra-wide 14mm lens',
    targetModel: 'sdxl',
    category: 'cat-landscapes',
    tags: ['Paisagem', 'Aurora Boreal', 'Islândia', 'Long Exposure', 'Glacial', 'NatGeo'],
    image: {
      url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80',
      storageType: 'sample',
      aspectRatio: '16:9',
      alt: 'Aurora boreal sobre praia de gelo'
    },
    structured: {
      subject: 'Aurora boreal dançante em cortinas esmeralda e púrpura sobre blocos de gelo cristalino espalhados',
      environment: 'Praia de areia negra vulcânica de Jokulsarlon na Islândia, com mar calmo e reflexos noturnos',
      lighting: 'Luz natural emitida pela aurora boreal e brilho estelar, criando luminescência translúcida no gelo',
      camera: 'Lente ultra-grande angular 14mm f/2.8, longa exposição de 15 segundos, ISO 1600',
      composition: 'Grande angular horizontal com linha do horizonte no terço inferior e céu dominando a cena',
      style: 'Fotografia de expedição natural da National Geographic com nitidez impecável de ponta a ponta',
      colors: 'Verde esmeralda radioativo, violeta profundo, preto ônix da areia e azul gélido translúcido',
      instructions: 'Garantir que as estrelas permaneçam nítidas como pontos (sem rastro excessivo).',
      parameters: {
        aspectRatio: '16:9',
        cfgScale: 7.5,
      }
    },
    isFavorite: true,
    copyCount: 31,
    notes: 'Perfeito em SDXL com modelos baseados em realismo paisagístico.',
    createdAt: '2026-08-10T22:15:00.000Z',
    updatedAt: '2026-08-10T22:15:00.000Z',
  }
];
