// Modelo completo de Prontuário Clínico integrado com Paciente - Alt Clinic
export const prontuarioSchema = {
  // Identificação
  id: { type: 'string', required: true, generated: true },
  pacienteId: { type: 'string', required: true, ref: 'Paciente' },
  numeroProtocolo: { type: 'string', required: true, unique: true }, // Ex: ALT-2025-00001
  
  // Anamnese Completa
  anamnese: {
    // Histórico Médico Geral
    historicoMedico: {
      alergias: {
        medicamentosas: { type: 'array', items: { nome: 'string', gravidade: 'enum', reacao: 'string' } },
        alimentares: { type: 'array', items: { alimento: 'string', sintomas: 'string' } },
        ambientais: { type: 'array', items: { agente: 'string', reacao: 'string' } },
        outras: { type: 'array', items: 'string' }
      },
      
      medicamentosAtuais: {
        type: 'array',
        items: {
          nome: 'string',
          dosagem: 'string',
          frequencia: 'string',
          motivoUso: 'string',
          dataInicio: 'date',
          medico: 'string'
        }
      },
      
      condicoesMedicas: {
        cardiovasculares: { type: 'array', items: 'string' },
        endocrinas: { type: 'array', items: 'string' },
        neurologicas: { type: 'array', items: 'string' },
        dermatologicas: { type: 'array', items: 'string' },
        respiratorias: { type: 'array', items: 'string' },
        gastrointestinais: { type: 'array', items: 'string' },
        geniturinarias: { type: 'array', items: 'string' },
        outras: { type: 'array', items: 'string' }
      },
      
      cirurgiasAnteriores: {
        type: 'array',
        items: {
          procedimento: 'string',
          data: 'date',
          hospital: 'string',
          medico: 'string',
          complicacoes: 'string',
          observacoes: 'string'
        }
      },
      
      habitosVida: {
        tabagismo: { status: 'enum', quantidadeDiaria: 'number', tempoUso: 'string' },
        etilismo: { status: 'enum', frequencia: 'string', tipo: 'string' },
        atividade_fisica: { pratica: 'boolean', tipo: 'string', frequencia: 'string' },
        alimentacao: { tipo: 'string', restricoes: 'array' },
        sono: { horasDiarias: 'number', qualidade: 'enum', disturbios: 'array' }
      }
    },
    
    // Anamnese Específica por Especialidade
    especialidade: {
      estetica: {
        tipoPele: { type: 'enum', options: ['Oleosa', 'Seca', 'Mista', 'Normal', 'Sensível'] },
        fototipo: { type: 'enum', options: ['I', 'II', 'III', 'IV', 'V', 'VI'] },
        exposicaoSolar: { frequencia: 'string', protecao: 'boolean', historicoQueimaduras: 'boolean' },
        cuidadosPele: { rotinaDiaria: 'text', produtosUsados: 'array' },
        preocupacoesPrincipais: { type: 'array', items: 'string' },
        expectativas: { type: 'text' },
        tratamentosAnteriores: {
          type: 'array',
          items: {
            tratamento: 'string',
            local: 'string',
            data: 'date',
            resultado: 'string',
            satisfacao: 'enum'
          }
        }
      },
      
      odontologia: {
        historicoOdontologico: { ultimaConsulta: 'date', frequencia: 'string' },
        higieneOral: { escovacao: 'string', fiodental: 'boolean', enxaguante: 'boolean' },
        sintomas: { dor: 'boolean', sangramento: 'boolean', sensibilidade: 'boolean' },
        habitos: { bruxismo: 'boolean', roerUnhas: 'boolean', morderObjetos: 'boolean' }
      },
      
      fisioterapia: {
        quadroAtual: { queixaPrincipal: 'text', intensidadeDor: 'number', localizacao: 'string' },
        historicoLesoes: { type: 'array', items: { lesao: 'string', data: 'date', tratamento: 'string' } },
        atividadeFisica: { tipo: 'string', frequencia: 'string', limitacoes: 'text' },
        ocupacao: { profissao: 'string', posturaTrabalho: 'string', esforcoFisico: 'string' }
      }
    },
    
    // Assinatura e Consentimento
    assinatura: {
      pacienteAssinou: { type: 'boolean', required: true },
      dataAssinatura: { type: 'datetime', required: true },
      assinaturaDigital: { type: 'text' }, // Base64 da assinatura
      termosAceitos: { type: 'array', items: 'string' },
      testemunha: { nome: 'string', documento: 'string' }
    }
  },
  
  // Timeline de Atendimentos
  timeline: {
    type: 'array',
    items: {
      id: 'string',
      tipo: { type: 'enum', options: ['Consulta', 'Procedimento', 'Retorno', 'Emergência', 'Exame'] },
      data: 'datetime',
      profissional: 'string',
      especialidade: 'string',
      
      // Dados do atendimento
      motivoConsulta: 'text',
      exameClinico: {
        sinaisVitais: {
          pressaoArterial: 'string',
          frequenciaCardiaca: 'number',
          temperatura: 'number',
          peso: 'number',
          altura: 'number',
          imc: 'number' // Calculado automaticamente
        },
        exameFisico: 'text',
        observacoes: 'text'
      },
      
      // Diagnóstico e Conduta
      diagnostico: {
        cid10: 'string',
        descricao: 'text',
        hipoteseDiagnostica: 'text'
      },
      
      procedimentosRealizados: {
        type: 'array',
        items: {
          codigo: 'string',
          nome: 'string',
          descricao: 'text',
          duracao: 'number',
          valor: 'number',
          profissionalExecutor: 'string',
          equipamentoUtilizado: 'string',
          materiaisUsados: 'array',
          complicacoes: 'text',
          resultadoImediato: 'text'
        }
      },
      
      prescricoes: {
        medicamentos: {
          type: 'array',
          items: {
            medicamento: 'string',
            dosagem: 'string',
            posologia: 'string',
            duracao: 'string',
            orientacoes: 'string'
          }
        },
        cuidadosGerais: 'text',
        retorno: { data: 'date', motivo: 'string', urgencia: 'enum' }
      },
      
      // Documentação
      anexos: {
        fotos: {
          type: 'array',
          items: {
            id: 'string',
            arquivo: 'file',
            descricao: 'string',
            categoria: 'enum', // antes, durante, depois, exame
            data: 'datetime',
            privacidade: 'enum' // publico, privado, medico_apenas
          }
        },
        documentos: {
          type: 'array',
          items: {
            id: 'string',
            tipo: 'enum', // receita, atestado, laudo, consentimento
            arquivo: 'file',
            descricao: 'string',
            data: 'datetime'
          }
        },
        exames: {
          type: 'array',
          items: {
            id: 'string',
            tipo: 'string',
            resultado: 'file',
            laudo: 'text',
            dataRealizacao: 'date',
            laboratorio: 'string',
            observacoes: 'text'
          }
        }
      },
      
      // Evolução e Follow-up
      evolucao: 'text',
      proximaConsulta: { data: 'date', motivo: 'string', profissional: 'string' },
      
      // Metadados
      metadata: {
        criadoEm: 'datetime',
        atualizadoEm: 'datetime',
        criadoPor: 'string',
        status: { type: 'enum', options: ['Aberto', 'Finalizado', 'Cancelado'] },
        duracao: 'number', // em minutos
        faturado: 'boolean',
        valorTotal: 'number'
      }
    }
  },
  
  // Plano de Tratamento
  planoTratamento: {
    objetivo: 'text',
    prazoEstimado: 'string',
    sessoesPrevistas: 'number',
    custoPrevisto: 'number',
    
    etapas: {
      type: 'array',
      items: {
        ordem: 'number',
        nome: 'string',
        descricao: 'text',
        procedimentos: 'array',
        prazo: 'string',
        custo: 'number',
        status: { type: 'enum', options: ['Pendente', 'Em Andamento', 'Concluído', 'Cancelado'] },
        observacoes: 'text'
      }
    },
    
    contraIndicacoes: 'text',
    cuidadosEspeciais: 'text',
    alternativas: 'text'
  },
  
  // Resultados e Acompanhamento
  resultados: {
    avaliacoes: {
      type: 'array',
      items: {
        data: 'date',
        tipo: 'enum', // inicial, intermediaria, final
        profissional: 'string',
        
        medidas: {
          antropometricas: { peso: 'number', altura: 'number', imc: 'number' },
          especificas: 'object' // Específico por especialidade
        },
        
        fotos: {
          type: 'array',
          items: {
            categoria: 'string',
            angulo: 'string',
            arquivo: 'file',
            observacoes: 'string'
          }
        },
        
        avaliacaoQualitativa: {
          satisfacaoPaciente: { escala: 'number', comentarios: 'text' },
          avaliacaoProfissional: 'text',
          melhorasObservadas: 'text',
          aspectosAprimorar: 'text'
        },
        
        proximosPassos: 'text'
      }
    },
    
    estatisticas: {
      totalSessoes: 'number',
      faltas: 'number',
      cancelamentos: 'number',
      satisfacaoMedia: 'number',
      investimentoTotal: 'number'
    }
  },
  
  // Comunicação e Relacionamento
  comunicacao: {
    preferencias: {
      canalPreferido: { type: 'enum', options: ['WhatsApp', 'SMS', 'Email', 'Telefone'] },
      horarioContato: 'string',
      frequenciaLembretes: 'string',
      tipoConteudo: 'array' // dicas, promoções, educativo
    },
    
    historico: {
      type: 'array',
      items: {
        data: 'datetime',
        canal: 'string',
        tipo: 'enum', // lembrete, promocao, educativo, cobranca, satisfacao
        conteudo: 'text',
        resposta: 'text',
        status: 'enum' // enviado, entregue, lido, respondido
      }
    }
  },
  
  // Aspectos Legais e Compliance
  compliance: {
    lgpd: {
      consentimentoTratamentoDados: {
        concedido: 'boolean',
        data: 'datetime',
        finalidades: 'array',
        baseLegal: 'string',
        revogado: 'boolean',
        dataRevogacao: 'datetime'
      },
      
      compartilhamentoDados: {
        autorizado: 'boolean',
        finalidade: 'string',
        terceiros: 'array'
      }
    },
    
    consentimentosEspecificos: {
      type: 'array',
      items: {
        tipo: 'string', // procedimento, fotografia, marketing
        descricao: 'text',
        concedido: 'boolean',
        data: 'datetime',
        testemunha: 'string',
        assinatura: 'text'
      }
    },
    
    auditoriaAcessos: {
      type: 'array',
      items: {
        usuario: 'string',
        acao: 'string',
        data: 'datetime',
        ip: 'string',
        detalhes: 'text'
      }
    }
  },
  
  // Metadados do Prontuário
  metadata: {
    versao: { type: 'string', default: '1.0' },
    criadoEm: 'datetime',
    atualizadoEm: 'datetime',
    criadoPor: 'string',
    ultimoAcesso: 'datetime',
    status: { type: 'enum', options: ['Ativo', 'Arquivado', 'Transferido'], default: 'Ativo' },
    
    // Backup e Sincronização
    backup: {
      ultimoBackup: 'datetime',
      hashIntegridade: 'string',
      localizacao: 'string'
    },
    
    // Analytics
    estatisticas: {
      totalAcessos: 'number',
      tempoMedioConsulta: 'number',
      frequenciaAtualizacao: 'number'
    }
  }
};

// Configurações de automação e IA para o prontuário
export const prontuarioAutomation = {
  // Lembretes automáticos
  lembretes: {
    retorno: {
      trigger: 'proximaConsulta.data',
      antecedencia: ['24h', '2h'],
      template: 'lembrete_consulta'
    },
    aniversario: {
      trigger: 'paciente.dataNascimento',
      template: 'parabens_aniversario'
    },
    followUp: {
      trigger: 'ultimoProcedimento.data + 7days',
      template: 'como_esta_tratamento'
    }
  },
  
  // Análises automáticas com IA
  analises: {
    riscoPaciente: {
      fatores: ['idade', 'condicoesMedicas', 'medicamentos', 'alergias'],
      provider: 'gemini',
      output: 'score_risco'
    },
    
    sugestoesTratamento: {
      input: ['diagnostico', 'historicoTratamentos', 'preferencias'],
      provider: 'gemini',
      output: 'plano_sugerido'
    },
    
    deteccaoPatterns: {
      trigger: 'novo_atendimento',
      analisa: 'timeline_completa',
      detecta: ['frequencia_faltas', 'satisfacao_declinio', 'aderencia_tratamento']
    }
  },
  
  // Integrações automáticas
  integracoes: {
    agenda: {
      syncFields: ['proximaConsulta', 'status'],
      trigger: 'atendimento_finalizado'
    },
    
    financeiro: {
      syncFields: ['procedimentosRealizados', 'valorTotal'],
      trigger: 'procedimento_adicionado'
    },
    
    crm: {
      syncFields: ['satisfacaoPaciente', 'statusTratamento'],
      trigger: 'avaliacao_realizada'
    }
  }
};

// Validações específicas do prontuário
export const prontuarioValidations = {
  obrigatorioPorAtendimento: {
    consulta: ['motivoConsulta', 'exameClinico', 'diagnostico', 'profissional'],
    procedimento: ['procedimentosRealizados', 'profissionalExecutor', 'resultadoImediato'],
    retorno: ['evolucao', 'proximaConsulta']
  },
  
  consentimentosNecessarios: {
    procedimentoInvasivo: ['consentimento_procedimento', 'assinatura_paciente'],
    fotografiaClinica: ['consentimento_imagem', 'finalidade_uso'],
    compartilhamentoDados: ['lgpd_compartilhamento']
  },
  
  documentacaoMinima: {
    primeiraConsulta: ['anamnese_completa', 'exame_fisico', 'plano_tratamento'],
    procedimentoEstetico: ['fotos_antes', 'consentimento_informado', 'orientacoes_pos']
  }
};

export default prontuarioSchema;
