const ManyChatService = require('../services/ManyChatService');

/**
 * Controlador para gerenciar automações do ManyChat
 */
class ManyChatController {
  constructor() {
    this.manyChatService = new ManyChatService();
  }

  /**
   * Webhook para receber eventos do ManyChat
   */
  async handleWebhook(req, res) {
    try {
      const { type, data } = req.body;
      
      console.log('📨 Webhook ManyChat recebido:', { type, data });

      switch (type) {
        case 'user_action':
          await this.handleUserAction(data);
          break;
        case 'message_received':
          await this.handleMessageReceived(data);
          break;
        case 'subscription_updated':
          await this.handleSubscriptionUpdated(data);
          break;
        default:
          console.log('ℹ️ Tipo de webhook não tratado:', type);
      }

      res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('❌ Erro no webhook ManyChat:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Tratar ações do usuário (botões, postbacks)
   */
  async handleUserAction(data) {
    const { subscriber_id, payload } = data;

    switch (payload) {
      case 'CONFIRM_PRESENCE':
        await this.confirmAppointmentPresence(subscriber_id);
        break;
      case 'RESCHEDULE_REQUEST':
        await this.handleRescheduleRequest(subscriber_id);
        break;
      case 'CANCEL_APPOINTMENT':
        await this.handleCancelRequest(subscriber_id);
        break;
      case 'VIEW_PAYMENT_DETAILS':
        await this.sendPaymentDetails(subscriber_id);
        break;
      case 'TALK_TO_SUPPORT':
        await this.transferToSupport(subscriber_id);
        break;
      case 'RATING_5':
      case 'RATING_4':
      case 'RATING_3':
        await this.handleSatisfactionRating(subscriber_id, payload);
        break;
      default:
        console.log('ℹ️ Payload não tratado:', payload);
    }
  }

  /**
   * Confirmar presença em consulta
   */
  async confirmAppointmentPresence(subscriberId) {
    try {
      // Aqui você integraria com seu sistema de agendamentos
      // para marcar a presença como confirmada
      
      await this.manyChatService.sendTextMessage(
        subscriberId,
        '✅ Presença confirmada! Obrigado. Nos vemos no horário marcado. 😊'
      );

      // Adicionar tag para controle
      await this.manyChatService.addTag(subscriberId, 'presence_confirmed');
      
    } catch (error) {
      console.error('❌ Erro ao confirmar presença:', error);
    }
  }

  /**
   * Lidar com pedido de reagendamento
   */
  async handleRescheduleRequest(subscriberId) {
    try {
      await this.manyChatService.sendTextMessage(
        subscriberId,
        '📅 Para reagendar sua consulta, nossa equipe entrará em contato com você em breve.\n\nOu você pode ligar diretamente para nossa clínica: 📞 (11) 99999-9999'
      );

      // Adicionar tag para que a equipe saiba que precisa entrar em contato
      await this.manyChatService.addTag(subscriberId, 'reschedule_requested');
      
    } catch (error) {
      console.error('❌ Erro ao processar reagendamento:', error);
    }
  }

  /**
   * Lidar com pedido de cancelamento
   */
  async handleCancelRequest(subscriberId) {
    try {
      await this.manyChatService.sendTextMessage(
        subscriberId,
        '❌ Lamentamos que precise cancelar. Nossa equipe entrará em contato para processar o cancelamento.\n\nSe preferir, ligue: 📞 (11) 99999-9999'
      );

      await this.manyChatService.addTag(subscriberId, 'cancellation_requested');
      
    } catch (error) {
      console.error('❌ Erro ao processar cancelamento:', error);
    }
  }

  /**
   * Enviar detalhes de pagamento
   */
  async sendPaymentDetails(subscriberId) {
    try {
      // Aqui você buscaria os detalhes reais do pagamento do banco de dados
      await this.manyChatService.sendTextMessage(
        subscriberId,
        '💰 *Detalhes do Pagamento*\n\n📋 Descrição: Consulta médica\n💵 Valor: R$ 150,00\n📅 Vencimento: 15/10/2025\n\nFormas de pagamento disponíveis:\n• Cartão de crédito/débito\n• PIX\n• Dinheiro na recepção'
      );
      
    } catch (error) {
      console.error('❌ Erro ao enviar detalhes de pagamento:', error);
    }
  }

  /**
   * Transferir para atendimento humano
   */
  async transferToSupport(subscriberId) {
    try {
      await this.manyChatService.sendTextMessage(
        subscriberId,
        '👥 Você será transferido para um atendente humano. Nossa equipe entrará em contato em breve.\n\nHorário de atendimento:\n🕐 Segunda a Sexta: 8h às 18h\n🕐 Sábado: 8h às 12h'
      );

      await this.manyChatService.addTag(subscriberId, 'support_requested');
      
    } catch (error) {
      console.error('❌ Erro ao transferir para suporte:', error);
    }
  }

  /**
   * Processar avaliação de satisfação
   */
  async handleSatisfactionRating(subscriberId, rating) {
    try {
      const ratingTexts = {
        'RATING_5': 'Excelente (5 estrelas)',
        'RATING_4': 'Muito Bom (4 estrelas)', 
        'RATING_3': 'Regular (3 estrelas)'
      };

      await this.manyChatService.sendTextMessage(
        subscriberId,
        `⭐ Obrigado por sua avaliação: ${ratingTexts[rating]}\n\nSua opinião é muito importante para melhorarmos nossos serviços! 😊`
      );

      // Salvar avaliação no campo personalizado
      await this.manyChatService.setCustomField(subscriberId, 'last_rating', rating);
      
      // Se a avaliação foi baixa, marcar para follow-up
      if (rating === 'RATING_3') {
        await this.manyChatService.addTag(subscriberId, 'low_satisfaction');
        await this.manyChatService.sendTextMessage(
          subscriberId,
          'Sentimos muito que sua experiência não tenha sido a melhor. Nossa equipe entrará em contato para entender como podemos melhorar.'
        );
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar avaliação:', error);
    }
  }

  /**
   * Enviar automação baseada em agendamento
   */
  async sendAppointmentAutomation(appointmentData, type) {
    try {
      const { patient_phone, patient_name, doctor_name, appointment_date, appointment_time, clinic_name } = appointmentData;
      
      // Converter telefone para subscriber_id (você precisará implementar essa lógica)
      const subscriberId = await this.getSubscriberIdByPhone(patient_phone);
      
      if (!subscriberId) {
        console.log('⚠️ Subscriber não encontrado para o telefone:', patient_phone);
        return;
      }

      const appointmentInfo = {
        patientName: patient_name,
        doctorName: doctor_name,
        date: appointment_date,
        time: appointment_time,
        clinicName: clinic_name
      };

      switch (type) {
        case 'confirmation':
          await this.manyChatService.sendAppointmentConfirmation(subscriberId, appointmentInfo);
          break;
        case 'reminder':
          await this.manyChatService.sendAppointmentReminder(subscriberId, appointmentInfo);
          break;
        case 'satisfaction_survey':
          await this.manyChatService.sendSatisfactionSurvey(subscriberId, appointmentInfo);
          break;
      }

    } catch (error) {
      console.error('❌ Erro na automação de agendamento:', error);
    }
  }

  /**
   * Buscar subscriber ID por telefone
   * Esta é uma função de exemplo - você precisará implementar a lógica
   * baseada em como você armazena a relação telefone <-> subscriber_id
   */
  async getSubscriberIdByPhone(phone) {
    try {
      // Aqui você consultaria seu banco de dados para encontrar o subscriber_id
      // baseado no número de telefone
      
      // Por enquanto, retorna null - implemente conforme sua necessidade
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar subscriber por telefone:', error);
      return null;
    }
  }
}

module.exports = ManyChatController;