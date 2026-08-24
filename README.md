# DAN IMAGES PROMPTS

Biblioteca inteligente para organizar, estruturar, pesquisar e reutilizar prompts de geração de imagens com Inteligência Artificial.

O DAN IMAGES PROMPTS foi criado para resolver um problema comum no trabalho com imagens generativas: prompts eficientes, referências visuais e configurações de modelos acabam espalhados entre documentos, conversas, pastas e diferentes ferramentas.

A proposta é transformar cada prompt em um ativo visual estruturado e reutilizável.

Visão geral

Em vez de armazenar somente um bloco de texto, o DAN IMAGES PROMPTS organiza cada entrada como uma combinação de:

Prompt + imagem de referência + categoria + modelo + metadados

A aplicação pode utilizar IA para analisar o prompt e sua referência visual, transformando o conteúdo em uma estrutura consistente com informações como:

* assunto;
* ambiente;
* iluminação;
* câmera e lente;
* composição;
* estilo;
* cores;
* instruções;
* tags;
* categoria;
* modelo de destino.

O usuário continua no controle: o conteúdo estruturado deve ser revisado antes de ser armazenado.

Fluxo principal

Novo Prompt
    ↓
Prompt + Imagem de Referência
    ↓
Categoria + Modelo
    ↓
Análise por IA
    ↓
JSON Estruturado
    ↓
Revisão
    ↓
Salvar
    ↓
Biblioteca Visual
    ↓
Pesquisar / Copiar / Reutilizar

O objetivo é reduzir o tempo gasto procurando prompts anteriores e tornar experimentos bem-sucedidos fáceis de encontrar e reutilizar.

Principais funcionalidades

Biblioteca visual

A página inicial funciona como uma biblioteca de referências, apresentando prompts através de thumbnails e informações essenciais.

O usuário pode navegar por categorias, pesquisar conteúdos e acessar rapidamente itens recentes ou favoritos.

Prompt estruturado

Um prompt pode ser transformado em uma representação estruturada semelhante a:

{
  "title": "Editorial cyberpunk feminino",
  "category": "fashion",
  "target": {
    "provider": "gemini",
    "model": "configurable"
  },
  "prompt": {
    "subject": "female fashion model",
    "environment": "futuristic Tokyo street",
    "lighting": "neon cinematic lighting",
    "camera": "85mm portrait lens",
    "composition": "medium close-up",
    "style": "high-fashion editorial",
    "colors": ["magenta", "cyan", "black"],
    "instructions": "Preserve facial consistency and realistic fabric textures."
  },
  "tags": [
    "fashion",
    "editorial",
    "cyberpunk",
    "portrait"
  ]
}

A imagem não precisa ser armazenada dentro desse JSON em Base64. O documento pode manter apenas a referência para o arquivo correspondente.

Organização por IA

A arquitetura prevê um agente de catalogação capaz de analisar texto e imagem para auxiliar na identificação de elementos importantes do prompt.

Essa etapa serve para organização, independentemente da geração de uma nova imagem.

Isso permite utilizar o DAN IMAGES PROMPTS como biblioteca mesmo quando nenhuma geração de imagem é necessária.

Categorias configuráveis

As categorias são tratadas como dados configuráveis para permitir que a biblioteca evolua sem depender de alterações no código para cada nova classificação.

Exemplos:

Personagem · Retrato · Produto · Embalagem · Moda · Publicidade · Cena · Arquitetura · Interior · Food · Mockup · Ilustração · 3D · Editorial · Social Media

Detalhe do prompt

Cada item pode apresentar:

* imagem de referência;
* título;
* categoria;
* modelo;
* tags;
* prompt estruturado;
* prompt original.

As principais ações planejadas incluem:

Copiar Prompt · Copiar JSON · Editar · Duplicar · Favoritar

Arquitetura

A arquitetura foi pensada para manter interface, dados e provedores de IA desacoplados.

┌──────────────────────┐
│       Web App        │
│   Responsive UI      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Backend Server     │
│   API / AI Gateway   │
└──────────┬───────────┘
           │
     ┌─────┴───────────────┐
     │                     │
     ▼                     ▼
┌─────────────┐      ┌─────────────┐
│  Firebase   │      │ AI Providers│
│ Auth / Data │      │ Gemini /    │
│             │      │ OpenAI      │
└─────────────┘      └─────────────┘

As integrações efetivamente disponíveis devem acompanhar o estado atual da implementação.

Segurança

Credenciais de serviços externos não devem ser incorporadas ao código executado no navegador.

Chaves como:

GEMINI_API_KEY
OPENAI_API_KEY

devem permanecer em ambiente server-side ou em um sistema apropriado de gerenciamento de secrets.

Também fazem parte da estratégia:

* autenticação;
* autorização por usuário;
* validação de uploads;
* validação de payloads;
* rate limiting para operações de IA;
* tratamento estruturado de erros;
* proteção contra acesso indevido aos dados;
* logs sem exposição desnecessária de prompts, imagens ou secrets.

Experiência do usuário

O produto segue uma abordagem visual e direta.

A prioridade é permitir que o usuário encontre ou registre um prompt com o menor número possível de decisões intermediárias.

A interface deve funcionar adequadamente em diferentes tamanhos de tela e preservar:

* hierarquia visual clara;
* contraste adequado;
* navegação previsível;
* estados de loading;
* empty states;
* feedback de erro;
* feedback de sucesso;
* acessibilidade;
* suporte a prefers-reduced-motion quando aplicável.

MVP

O primeiro objetivo do produto é completar este fluxo:

LOGIN
  ↓
BIBLIOTECA
  ↓
NOVO PROMPT
  ↓
PROMPT + IMAGEM
  ↓
CATEGORIA + MODELO
  ↓
ANÁLISE POR IA
  ↓
REVISÃO
  ↓
SALVAR
  ↓
LOCALIZAR NOVAMENTE
  ↓
COPIAR PROMPT / JSON

A geração direta de imagens pode ser adicionada posteriormente sem transformar essa funcionalidade em requisito para a biblioteca.

Roadmap

Fase 1: Fundação

Estrutura da aplicação, autenticação, persistência e ambientes.

Fase 2: Biblioteca

Categorias, cards, thumbnails, pesquisa, favoritos e detalhes dos prompts.

Fase 3: Catalogação inteligente

Análise de prompt e imagem, normalização estruturada e revisão antes do armazenamento.

Fase 4: Geração de imagens

Integração dos providers de geração suportados pelo projeto.

Fase 5: Comparação entre modelos

Possibilidade de executar o mesmo prompt em providers diferentes e comparar os resultados.

Fase 6: Evolução da biblioteca

Recursos considerados para versões futuras:

* coleções;
* histórico de versões;
* múltiplas referências;
* presets;
* templates;
* compartilhamento;
* busca semântica;
* contador de utilização;
* histórico de gerações;
* comparação A/B.

Princípio do projeto

O DAN IMAGES PROMPTS não pretende ser apenas um CRUD de textos.

Cada prompt deve ser tratado como um ativo criativo reutilizável, ligado ao contexto visual que o tornou útil.

A arquitetura deve permitir adicionar novos modelos e provedores sem exigir que a experiência principal da biblioteca seja reconstruída.

Status

🚧 Em desenvolvimento

Funcionalidades descritas neste documento podem representar tanto recursos implementados quanto partes do roadmap. Consulte o código e as releases do projeto para verificar o estado atual de cada recurso.

Autor

Danilo Novais

Projeto desenvolvido para organizar e evoluir workflows de criação de imagens com Inteligência Artificial.
