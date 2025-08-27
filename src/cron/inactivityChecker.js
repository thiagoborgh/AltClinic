const cron = require('node-cron');
const dbManager = require('../models/database');
const PacienteModel = require('../models/Paciente');
const AgendamentoModel = require('../models/Agendamento');
const { sendWhatsAppMessage, sendTelegramMessage } = require('../utils/bot');
const { sendEmail } = require('../utils/mailchimp');
const aiService = require('../utils/ai'); // Nova integração

class CronJobManager {
  constructor() {
    this.db = dbManager.getDb();
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Inicia todos os cron jobs
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Cron jobs já estão rodando');
      return;
    }

    console.log('🚀 Iniciando cron jobs...');
    
    this.setupInactivityChecker();
    this.setupConfirmationReminder();
    this.setupAppointmentReminder();
    this.setupDailyReports();
    
    this.isRunning = true;
    console.log('✅ Todos os cron jobs foram iniciados');
  }

  /**
   * Para todos os cron jobs
   */
  stop() {
    console.log('🛑 Parando cron jobs...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🔴 ${name} parado`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ Todos os cron jobs foram parados');
  }

  /**
   * Job para verificar pacientes inativos
   * Executa diariamente às 9h
   */
  setupInactivityChecker() {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('📊 Verificando pacientes inativos...');
      
      try {
        const clinicas = this.db.prepare('SELECT id, nome FROM clinica').all();
        
        for (const clinica of clinicas) {
          await this.processInactivePatients(clinica);
        }
        
        console.log('✅ Verificação de inativos concluída');
        
      } catch (error) {
        console.error('❌ Erro na verificação de inativos:', error.message);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.set('inactivityChecker', job);
    console.log('📅 Job de verificação de inativos configurado (9h diárias)');
  }

  /**
   * Job para enviar confirmações de agendamento
   * Executa a cada 2 horas durante horário comercial
   */
  setupConfirmationReminder() {
    const job = cron.schedule('0 8-18/2 * * *', async () => {
      console.log('📞 Enviando confirmações de agendamento...');
      
      try {
        const clinicas = this.db.prepare('SELECT id, nome FROM clinica').all();
        
        for (const clinica of clinicas) {
          await this.processConfirmationReminders(clinica);
        }
        
        console.log('✅ Confirmações enviadas');
        
      } catch (error) {
        console.error('❌ Erro no envio de confirmações:', error.message);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.set('confirmationReminder', job);
    console.log('📅 Job de confirmação configurado (a cada 2h das 8h às 18h)');
  }

  /**
   * Job para lembretes de agendamento
   * Executa a cada hora durante horário comercial
   */
  setupAppointmentReminder() {
    const job = cron.schedule('0 8-20 * * *', async () => {
      console.log('⏰ Enviando lembretes de agendamento...');
      
      try {
        const clinicas = this.db.prepare('SELECT id, nome FROM clinica').all();
        
        for (const clinica of clinicas) {
          await this.processAppointmentReminders(clinica);
        }
        
        console.log('✅ Lembretes enviados');
        
      } catch (error) {
        console.error('❌ Erro no envio de lembretes:', error.message);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.set('appointmentReminder', job);
    console.log('📅 Job de lembretes configurado (a cada hora das 8h às 20h)');
  }

  /**
   * Job para relatórios diários
   * Executa diariamente às 20h
   */
  setupDailyReports() {
    const job = cron.schedule('0 20 * * *', async () => {
      console.log('📈 Gerando relatórios diários...');
      
      try {
        const clinicas = this.db.prepare('SELECT id, nome FROM clinica').all();
        
        for (const clinica of clinicas) {
          await this.generateDailyReport(clinica);
        }
        
        console.log('✅ Relatórios diários gerados');
        
      } catch (error) {
        console.error('❌ Erro na geração de relatórios:', error.message);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.set('dailyReports', job);
    console.log('📅 Job de relatórios diários configurado (20h)');
  }

  /**
   * Processa pacientes inativos de uma clínica
   * @param {Object} clinica - Dados da clínica
   */
  async processInactivePatients(clinica) {
    try {
      const diasInativo = process.env.DIAS_INATIVO || 90;
      const inativos = PacienteModel.findInativos(clinica.id, diasInativo);
      
      console.log(`🏥 Clínica ${clinica.nome}: ${inativos.length} pacientes inativos encontrados`);
      
      for (const paciente of inativos) {
        await this.sendInactivePatientMessage(paciente, clinica);
        
        // Pequeno delay para evitar spam
        await this.sleep(1000);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar inativos da clínica ${clinica.nome}:`, error.message);
    }
  }

  /**
   * Processa confirmações de agendamento
   * @param {Object} clinica - Dados da clínica
   */
  async processConfirmationReminders(clinica) {
    try {
      const agendamentos = AgendamentoModel.findParaConfirmacao(clinica.id);
      
      console.log(`🏥 Clínica ${clinica.nome}: ${agendamentos.length} agendamentos para confirmar`);
      
      for (const agendamento of agendamentos) {
        await this.sendConfirmationMessage(agendamento, clinica);
        await this.sleep(500);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar confirmações da clínica ${clinica.nome}:`, error.message);
    }
  }

  /**
   * Processa lembretes de agendamento
   * @param {Object} clinica - Dados da clínica
   */
  async processAppointmentReminders(clinica) {
    try {
      const agendamentos = AgendamentoModel.findParaLembrete(clinica.id);
      
      console.log(`🏥 Clínica ${clinica.nome}: ${agendamentos.length} lembretes para enviar`);
      
      for (const agendamento of agendamentos) {
        await this.sendAppointmentReminder(agendamento, clinica);
        await this.sleep(500);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar lembretes da clínica ${clinica.nome}:`, error.message);
    }
  }

  /**
   * Envia mensagem para paciente inativo
   * @param {Object} paciente - Dados do paciente
   * @param {Object} clinica - Dados da clínica
   */
  async sendInactivePatientMessage(paciente, clinica) {
    try {
      // Gerar mensagem personalizada com IA
      let mensagem;
      try {
        const context = {
          nomeClinica: clinica.nome,
          nomeCliente: paciente.nome,
          ultimoAtendimento: paciente.ultimo_atendimento
        };
        
        mensagem = await aiService.gerarRespostaBot(
          'cliente inativo há muito tempo', 
          context
        );
      } catch (error) {
        // Fallback se IA não estiver disponível
        const diasSemAtendimento = Math.floor(paciente.dias_sem_atendimento);
        mensagem = `Olá ${paciente.nome}! 😊\n\nSentimos sua falta na ${clinica.nome}! ` +
                  `Faz ${diasSemAtendimento} dias desde seu último atendimento.\n\n` +
                  `Que tal agendar uma nova sessão? Temos novidades especiais para você! 💄✨\n\n` +
                  `Responda esta mensagem para agendar.`;
      }
      
      // Tentar enviar por WhatsApp primeiro
      let sucesso = await this.sendMessage(paciente.telefone, mensagem, 'whatsapp');
      
      // Se falhar, tentar por email
      if (!sucesso && paciente.email) {
        sucesso = await this.sendMessage(paciente.email, mensagem, 'email');
      }
      
      // Registrar tentativa de envio
      this.registrarMensagemCRM(paciente.id, 'inativo', mensagem, sucesso ? 'enviada' : 'erro');
      
      if (sucesso) {
        console.log(`📱 Mensagem de reativação enviada para ${paciente.nome}`);
      } else {
        console.log(`⚠️  Falha ao enviar mensagem para ${paciente.nome}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para paciente ${paciente.nome}:`, error.message);
    }
  }

  /**
   * Envia confirmação de agendamento
   * @param {Object} agendamento - Dados do agendamento
   * @param {Object} clinica - Dados da clínica
   */
  async sendConfirmationMessage(agendamento, clinica) {
    try {
      const dataFormatada = new Date(agendamento.data_hora).toLocaleString('pt-BR');
      
      const mensagem = `🗓️ *Confirmação de Agendamento*\n\n` +
                      `Olá ${agendamento.paciente_nome}!\n\n` +
                      `Confirme seu agendamento:\n` +
                      `📅 Data: ${dataFormatada}\n` +
                      `💆‍♀️ Procedimento: ${agendamento.procedimento_nome}\n` +
                      `🏥 Local: ${clinica.nome}\n\n` +
                      `Responda *SIM* para confirmar ou *REMARCAR* se precisar alterar.`;
      
      const sucesso = await this.sendMessage(agendamento.paciente_telefone, mensagem, 'whatsapp');
      
      this.registrarMensagemCRM(agendamento.paciente_id, 'confirmacao', mensagem, sucesso ? 'enviada' : 'erro');
      
      if (sucesso) {
        console.log(`✅ Confirmação enviada para ${agendamento.paciente_nome}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao enviar confirmação para agendamento ${agendamento.id}:`, error.message);
    }
  }

  /**
   * Envia lembrete de agendamento
   * @param {Object} agendamento - Dados do agendamento
   * @param {Object} clinica - Dados da clínica
   */
  async sendAppointmentReminder(agendamento, clinica) {
    try {
      const dataFormatada = new Date(agendamento.data_hora).toLocaleString('pt-BR');
      
      let mensagem = `⏰ *Lembrete de Agendamento*\n\n` +
                    `Olá ${agendamento.paciente_nome}!\n\n` +
                    `Seu agendamento está próximo:\n` +
                    `📅 Data: ${dataFormatada}\n` +
                    `💆‍♀️ Procedimento: ${agendamento.procedimento_nome}\n` +
                    `🏥 Local: ${clinica.nome}`;
      
      // Adicionar instruções de preparo se houver
      if (agendamento.preparo_texto) {
        mensagem += `\n\n📋 *Preparo necessário:*\n${agendamento.preparo_texto}`;
      }
      
      mensagem += `\n\nNos vemos em breve! 😊`;
      
      const sucesso = await this.sendMessage(agendamento.paciente_telefone, mensagem, 'whatsapp');
      
      this.registrarMensagemCRM(agendamento.paciente_id, 'lembrete', mensagem, sucesso ? 'enviada' : 'erro');
      
      if (sucesso) {
        console.log(`📱 Lembrete enviado para ${agendamento.paciente_nome}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao enviar lembrete para agendamento ${agendamento.id}:`, error.message);
    }
  }

  /**
   * Gera relatório diário
   * @param {Object} clinica - Dados da clínica
   */
  async generateDailyReport(clinica) {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const agendamentosHoje = AgendamentoModel.findByData(clinica.id, hoje);
      const estatisticas = AgendamentoModel.getEstatisticas(clinica.id, 'hoje');
      
      const relatorio = {
        clinica: clinica.nome,
        data: hoje,
        agendamentos: agendamentosHoje.length,
        realizados: agendamentosHoje.filter(a => a.status === 'realizado').length,
        cancelados: agendamentosHoje.filter(a => a.status === 'cancelado').length,
        pendentes: agendamentosHoje.filter(a => a.status === 'agendado').length,
        receita_estimada: agendamentosHoje
          .filter(a => a.status === 'realizado')
          .reduce((total, a) => total + (a.preco || 0), 0)
      };
      
      console.log(`📊 Relatório diário da ${clinica.nome}:`, relatorio);
      
      // Aqui você pode salvar o relatório em arquivo, enviar por email, etc.
      
    } catch (error) {
      console.error(`❌ Erro ao gerar relatório da clínica ${clinica.nome}:`, error.message);
    }
  }

  /**
   * Envia mensagem por diferentes canais
   * @param {string} destinatario - Telefone ou email
   * @param {string} mensagem - Conteúdo da mensagem
   * @param {string} canal - Canal de envio
   * @returns {boolean} - Sucesso no envio
   */
  async sendMessage(destinatario, mensagem, canal = 'whatsapp') {
    try {
      switch (canal) {
        case 'whatsapp':
          return await sendWhatsAppMessage(destinatario, mensagem);
        case 'telegram':
          return await sendTelegramMessage(destinatario, mensagem);
        case 'email':
          return await sendEmail(destinatario, 'Mensagem da Clínica', mensagem);
        default:
          console.warn(`⚠️  Canal ${canal} não suportado`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem via ${canal}:`, error.message);
      return false;
    }
  }

  /**
   * Registra mensagem no banco de dados
   * @param {number} pacienteId - ID do paciente
   * @param {string} tipo - Tipo da mensagem
   * @param {string} conteudo - Conteúdo da mensagem
   * @param {string} status - Status do envio
   */
  registrarMensagemCRM(pacienteId, tipo, conteudo, status = 'enviada') {
    try {
      this.db.prepare(`
        INSERT INTO mensagem_crm (paciente_id, tipo, conteudo, status)
        VALUES (?, ?, ?, ?)
      `).run(pacienteId, tipo, conteudo, status);
    } catch (error) {
      console.error('❌ Erro ao registrar mensagem CRM:', error.message);
    }
  }

  /**
   * Utilitário para delay
   * @param {number} ms - Milissegundos
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Executa job manualmente para teste
   * @param {string} jobName - Nome do job
   */
  async runManual(jobName) {
    console.log(`🔧 Executando job manual: ${jobName}`);
    
    const clinicas = this.db.prepare('SELECT id, nome FROM clinica').all();
    
    switch (jobName) {
      case 'inactivity':
        for (const clinica of clinicas) {
          await this.processInactivePatients(clinica);
        }
        break;
      case 'confirmation':
        for (const clinica of clinicas) {
          await this.processConfirmationReminders(clinica);
        }
        break;
      case 'reminder':
        for (const clinica of clinicas) {
          await this.processAppointmentReminders(clinica);
        }
        break;
      case 'report':
        for (const clinica of clinicas) {
          await this.generateDailyReport(clinica);
        }
        break;
      default:
        console.log(`❌ Job ${jobName} não encontrado`);
    }
  }

  /**
   * Retorna status dos jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
      timezone: 'America/Sao_Paulo'
    };
  }
}

module.exports = new CronJobManager();
