/**
 * N1 - VALIDAÇÃO DE INFORMAÇÕES
 * Verifica se o ticket possui todos os dados necessários
 */

export const tool = {
  name: 'movidesk_analyze_n1',
  description: 'Valida se ticket tem todas informações necessárias (usuário, cenário, dispositivo)',
  inputSchema: {
    type: 'object',
    properties: {
      ticket_data: {
        type: 'object',
        description: 'Dados do ticket do Movidesk'
      }
    },
    required: ['ticket_data']
  },
  handler: async (params: any) => {
    const { ticket_data } = params;
    
    // Campos obrigatórios
    const requiredFields = [
      { key: 'usuario', label: 'Usuário' },
      { key: 'cenario', label: 'Cenário de uso' },
      { key: 'dispositivo', label: 'Dispositivo' },
      { key: 'descricao', label: 'Descrição clara' },
    ];
    
    const missing: string[] = [];
    const found: string[] = [];
    
    // Validar campos
    for (const field of requiredFields) {
      // Aqui você implementaria a lógica real de validação
      // Por enquanto, é um exemplo
      const hasField = ticket_data[field.key];
      
      if (hasField) {
        found.push(field.label);
      } else {
        missing.push(field.label);
      }
    }
    
    return {
      status: missing.length === 0 ? 'completo' : 'incompleto',
      found,
      missing,
      shouldProceedToN2: missing.length === 0,
    };
  }
};