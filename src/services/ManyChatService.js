const axios = require('axios');

/**
 * Serviço para integração com ManyChat API
 */
class ManyChatService {
  constructor() {
    this.pageId = '9353710';
    this.apiToken = '8f05258497356cfe8a039e79200b2af4';
    this.baseUrl = 'https://api.manychat.com';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiToken}`
    };
  }

  /**
   * Enviar mensagem de texto simples
   */
  async sendTextMessage(subscriberId, message) {
    try {
      const payload = {
        subscriber_id: subscriberId,
        data: {
          version: 'v2',
          content: {
            messages: [
              {
                type: 'text',
                text: message
              }
            ]
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/fb/sending/sendContent`,
        payload,
        { headers: this.headers }
      );

      console.log('✅ Mensagem enviada via ManyChat:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem ManyChat:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar confirmação de agendamento
   */
  async sendAppointmentConfirmation(subscriberId, appointmentData) {
    const { patientName, doctorName, date, time, clinicName } = appointmentData;
    
    const message = `🏥 *${clinicName}*

✅ *Agendamento Confirmado*

👤 Paciente: ${patientName}
👨‍⚕️ Médico: ${doctorName}
📅 Data: ${date}
🕐 Horário: ${time}

ℹ️ Por favor, chegue 15 minutos antes do horário marcado.

Em caso de cancelamento, entre em contato com pelo menos 24h de antecedência.`;

    return await this.sendTextMessage(subscriberId, message);
  }

  /**
   * Enviar lembrete de consulta
   */
  async sendAppointmentReminder(subscriberId, appointmentData) {
    const { patientName, doctorName, date, time, clinicName } = appointmentData;

    const payload = {
      subscriber_id: subscriberId,
      data: {
        version: 'v2',
        content: {
          messages: [
            {
              type: 'cards',
              elements: [
                {
                  title: `🔔 Lembrete de Consulta`,
                  subtitle: `${patientName}, você tem consulta marcada com ${doctorName} para ${date} às ${time}`,
                  buttons: [
                    {
                      type: 'postback',
                      title: '✅ Confirmar Presença',
                      payload: 'CONFIRM_PRESENCE'
                    },
                    {
                      type: 'postback',
                      title: '📞 Reagendar',
                      payload: 'RESCHEDULE_REQUEST'
                    },
                    {
                      type: 'postback',
                      title: '❌ Cancelar',
                      payload: 'CANCEL_APPOINTMENT'
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/fb/sending/sendContent`,
        payload,
        { headers: this.headers }
      );

      console.log('✅ Lembrete de consulta enviado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar lembrete:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar cobrança de pagamento
   */
  async sendPaymentRequest(subscriberId, paymentData) {
    const { patientName, amount, dueDate, description, paymentLink } = paymentData;

    const payload = {
      subscriber_id: subscriberId,
      data: {
        version: 'v2',
        content: {
          messages: [
            {
              type: 'cards',
              elements: [
                {
                  title: '💰 Cobrança Pendente',
                  subtitle: `${patientName}, você possui uma pendência de R$ ${amount} referente a: ${description}. Vencimento: ${dueDate}`,
                  buttons: [
                    {
                      type: 'web_url',
                      title: '💳 Pagar Agora',
                      url: paymentLink
                    },
                    {
                      type: 'postback',
                      title: '📋 Ver Detalhes',
                      payload: 'VIEW_PAYMENT_DETAILS'
                    },
                    {
                      type: 'postback',
                      title: '🗣️ Falar com Atendente',
                      payload: 'TALK_TO_SUPPORT'
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/fb/sending/sendContent`,
        payload,
        { headers: this.headers }
      );

      console.log('✅ Cobrança enviada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar cobrança:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obter informações do subscriber
   */
  async getSubscriberInfo(subscriberId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/fb/subscriber/getInfo?subscriber_id=${subscriberId}`,
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter info do subscriber:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Adicionar tag ao subscriber
   */
  async addTag(subscriberId, tagName) {
    try {
      const payload = {
        subscriber_id: subscriberId,
        tag_name: tagName
      };

      const response = await axios.post(
        `${this.baseUrl}/fb/subscriber/addTag`,
        payload,
        { headers: this.headers }
      );

      console.log(`✅ Tag "${tagName}" adicionada ao subscriber`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar tag:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Definir campo personalizado
   */
  async setCustomField(subscriberId, fieldName, fieldValue) {
    try {
      const payload = {
        subscriber_id: subscriberId,
        field_name: fieldName,
        field_value: fieldValue
      };

      const response = await axios.post(
        `${this.baseUrl}/fb/subscriber/setCustomField`,
        payload,
        { headers: this.headers }
      );

      console.log(`✅ Campo "${fieldName}" definido como "${fieldValue}"`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao definir campo personalizado:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar pesquisa de satisfação
   */
  async sendSatisfactionSurvey(subscriberId, appointmentData) {
    const { patientName, doctorName, date } = appointmentData;

    const payload = {
      subscriber_id: subscriberId,
      data: {
        version: 'v2',
        content: {
          messages: [
            {
              type: 'text',
              text: `Olá ${patientName}! 😊

Como foi sua consulta com ${doctorName} no dia ${date}?

Sua opinião é muito importante para nós!`
            },
            {
              type: 'cards',
              elements: [
                {
                  title: 'Avalie seu Atendimento',
                  subtitle: 'Como você classificaria nossa clínica?',
                  buttons: [
                    {
                      type: 'postback',
                      title: '⭐⭐⭐⭐⭐ Excelente',
                      payload: 'RATING_5'
                    },
                    {
                      type: 'postback',
                      title: '⭐⭐⭐⭐ Muito Bom',
                      payload: 'RATING_4'
                    },
                    {
                      type: 'postback',
                      title: '⭐⭐⭐ Regular',
                      payload: 'RATING_3'
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/fb/sending/sendContent`,
        payload,
        { headers: this.headers }
      );

      console.log('✅ Pesquisa de satisfação enviada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar pesquisa:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = ManyChatService;