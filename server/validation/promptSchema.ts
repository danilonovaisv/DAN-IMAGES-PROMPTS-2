export function validatePromptInput(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Corpo da requisição inválido' };
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return { isValid: false, error: 'O título do prompt é obrigatório' };
  }

  if (!data.rawPrompt || typeof data.rawPrompt !== 'string' || data.rawPrompt.trim().length === 0) {
    return { isValid: false, error: 'O texto do prompt não pode ser vazio' };
  }

  if (data.title.length > 250) {
    return { isValid: false, error: 'O título não pode ter mais de 250 caracteres' };
  }

  if (data.rawPrompt.length > 8000) {
    return { isValid: false, error: 'O prompt bruto não pode exceder 8000 caracteres' };
  }

  return { isValid: true };
}
