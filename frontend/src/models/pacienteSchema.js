// Modelo de dados para Pacientes - Alt Clinic
export const pacienteSchema = {
  // Dados Pessoais (Obrigatórios)
  id: { type: 'string', required: true, generated: true },
  nomeCompleto: { type: 'string', required: true, minLength: 3 },
  cpf: { type: 'string', required: true, unique: true, mask: '000.000.000-00' },
  rg: { type: 'string', required: false },
  dataNascimento: { type: 'date', required: true },
  genero: { 
    type: 'enum', 
    required: true, 
    options: ['Masculino', 'Feminino', 'Outro', 'Não Informar'] 
  },
  
  // Contato (Telefone obrigatório)
  telefone: { type: 'string', required: true, mask: '+55 (11) 99999-9999' },
  email: { type: 'email', required: false },
  endereco: {
    rua: { type: 'string', required: false },
    numero: { type: 'string', required: false },
    complemento: { type: 'string', required: false },
    bairro: { type: 'string', required: false },
    cep: { type: 'string', required: false, mask: '00000-000' },
    cidade: { type: 'string', required: false },
    estado: { type: 'string', required: false },
    pais: { type: 'string', required: false, default: 'Brasil' }
  },
  
  // Clínicos (Não obrigatórios)
  anamneseBasica: {
    alergias: { type: 'array', items: 'string' },
    medicamentos: { type: 'array', items: 'string' },
    condicoesMedicas: { type: 'array', items: 'string' },
    cirurgiasAnteriores: { type: 'array', items: 'string' },
    observacoesGerais: { type: 'text' }
  },
  
  historicoProcedimentos: {
    type: 'array',
    items: {
      data: 'date',
      procedimento: 'string',
      profissional: 'string',
      observacoes: 'string',
      valor: 'number'
    }
  },
  
  // Consentimentos (Obrigatório)
  consentimentos: {
    mensagensAutomatizadas: { 
      type: 'boolean', 
      required: true, 
      default: false,
      metadata: {
        dataConsentimento: 'datetime',
        ipConsentimento: 'string',
        textoConsentimento: 'string'
      }
    },
    compartilhamentoDados: { type: 'boolean', default: false },
    marketingPromocional: { type: 'boolean', default: false }
  },
  
  // Mídia
  foto: { 
    type: 'file', 
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: '2MB',
    compression: true
  },
  
  // Observações livres
  observacoes: { type: 'text' },
  
  // Metadados automáticos
  metadata: {
    criadoEm: { type: 'datetime', auto: true },
    atualizadoEm: { type: 'datetime', auto: true },
    criadoPor: { type: 'string' },
    ultimoAtendimento: { type: 'datetime', auto: true },
    idade: { type: 'number', calculated: true }, // Calculado da data nascimento
    status: { 
      type: 'enum', 
      options: ['Ativo', 'Inativo', 'Bloqueado'],
      default: 'Ativo'
    },
    origem: { 
      type: 'enum',
      options: ['Manual', 'WhatsApp Bot', 'Site', 'Indicação'],
      default: 'Manual'
    },
    segmentoCRM: { type: 'string', auto: true } // Definido automaticamente
  }
};

// Regras de validação
export const validationRules = {
  cpf: {
    validator: (value) => {
      // Validação de CPF brasileiro
      const cpf = value.replace(/[^\d]/g, '');
      if (cpf.length !== 11) return false;
      
      // Verifica sequências inválidas
      if (/^(\d)\1{10}$/.test(cpf)) return false;
      
      // Validação dos dígitos verificadores
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.charAt(9))) return false;
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      return remainder === parseInt(cpf.charAt(10));
    },
    message: 'CPF inválido'
  },
  
  telefone: {
    validator: (value) => {
      const phone = value.replace(/[^\d]/g, '');
      return phone.length >= 10 && phone.length <= 11;
    },
    message: 'Telefone deve ter 10 ou 11 dígitos'
  },
  
  email: {
    validator: (value) => {
      if (!value) return true; // Opcional
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message: 'Email inválido'
  }
};

// Configurações de automação
export const automationConfig = {
  // Sugestões de IA baseadas em dados demográficos
  aiSuggestions: {
    anamneseBasica: {
      triggers: ['genero', 'idade'],
      provider: 'gemini', // ou 'huggingface'
      prompts: {
        feminino_adulto: "Sugira perguntas de anamnese para mulher adulta em clínica estética",
        masculino_adulto: "Sugira perguntas de anamnese para homem adulto em clínica estética",
        idoso: "Sugira perguntas específicas para paciente idoso",
        jovem: "Sugira perguntas para paciente jovem"
      }
    }
  },
  
  // Preenchimento automático
  autoFill: {
    endereco: {
      provider: 'viacep',
      trigger: 'cep',
      fields: ['rua', 'bairro', 'cidade', 'estado']
    },
    idade: {
      trigger: 'dataNascimento',
      calculation: (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      }
    }
  },
  
  // Mensagens automáticas
  messaging: {
    boasVindas: {
      condition: 'consentimentos.mensagensAutomatizadas === true',
      template: 'bem_vindo_paciente',
      delay: 0 // Imediato
    },
    lembreteAniversario: {
      condition: 'consentimentos.marketingPromocional === true',
      template: 'parabens_aniversario',
      trigger: 'dataNascimento'
    }
  }
};

export default pacienteSchema;
