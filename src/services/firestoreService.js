// Firebase Admin SDK - Integração com Firestore
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

class FirestoreService {
  constructor() {
    try {
      // Inicializar Firebase Admin
      if (!admin.apps.length) {
        // Tentar usar credenciais do arquivo local primeiro
        let initialized = false;
        
        // Opção 1: Arquivo de credenciais local (desenvolvimento)
        try {
          const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
          if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              projectId: serviceAccount.project_id
            });
            console.log('✅ Firebase Admin inicializado com service account LOCAL');
            initialized = true;
          }
        } catch (localError) {
          console.log('⚠️  Arquivo de credenciais local não encontrado, tentando credenciais padrão...');
        }

        // Opção 2: Credenciais padrão do ambiente (produção/Cloud Run)
        if (!initialized) {
          admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'meu-app-de-clinica'
          });
          console.log('✅ Firebase Admin inicializado com credenciais padrão do ambiente');
        }
      }

      this.db = admin.firestore();
      console.log('✅ Firestore conectado');
    } catch (error) {
      console.error('❌ Erro ao inicializar Firestore:', error);
      this.db = null;
    }
  }

  /**
   * Criar tenant no Firestore
   */
  async createTenant(tenantData) {
    try {
      const tenantRef = await this.db.collection('tenants').add({
        ...tenantData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { id: tenantRef.id, ...tenantData };
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
      throw error;
    }
  }

  /**
   * Buscar tenant por slug
   */
  async getTenantBySlug(slug) {
    try {
      const snapshot = await this.db.collection('tenants')
        .where('slug', '==', slug)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Erro ao buscar tenant:', error);
      throw error;
    }
  }

  /**
   * Buscar todos os tenants ativos
   */
  async getActiveTenants() {
    try {
      const snapshot = await this.db.collection('tenants')
        .where('status', 'in', ['active', 'trial'])
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erro ao listar tenants:', error);
      throw error;
    }
  }

  /**
   * Criar usuário no tenant
   */
  async createUser(tenantId, userData) {
    try {
      const userRef = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('usuarios')
        .add({
          ...userData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      return { id: userRef.id, ...userData };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  /**
   * Buscar usuário por email no tenant
   */
  async getUserByEmail(tenantId, email) {
    try {
      const snapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('usuarios')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  }

  /**
   * Atualizar usuário
   */
  async updateUser(tenantId, userId, updates) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('usuarios')
        .doc(userId)
        .update({
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /**
   * Buscar usuário em todos os tenants por email
   */
  async findUserAcrossTenants(email) {
    try {
      const tenants = await this.getActiveTenants();
      const results = [];

      for (const tenant of tenants) {
        const user = await this.getUserByEmail(tenant.id, email);
        if (user) {
          results.push({ tenant, user });
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao buscar usuário em tenants:', error);
      throw error;
    }
  }

  /**
   * Criar token de reset de senha
   */
  async createPasswordResetToken(email, token, expiresAt) {
    try {
      await this.db.collection('password_reset_tokens').add({
        email,
        token,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        used: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar token de reset:', error);
      throw error;
    }
  }

  /**
   * Verificar token de reset
   */
  async validatePasswordResetToken(token) {
    try {
      const snapshot = await this.db.collection('password_reset_tokens')
        .where('token', '==', token)
        .where('used', '==', false)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      // Verificar se expirou
      if (data.expiresAt.toDate() < new Date()) {
        return null;
      }

      return { id: doc.id, ...data };
    } catch (error) {
      console.error('Erro ao validar token:', error);
      throw error;
    }
  }

  /**
   * Marcar token como usado
   */
  async markTokenAsUsed(tokenId) {
    try {
      await this.db.collection('password_reset_tokens')
        .doc(tokenId)
        .update({ used: true });

      return true;
    } catch (error) {
      console.error('Erro ao marcar token como usado:', error);
      throw error;
    }
  }

  // ============ MÉTODOS PARA PACIENTES ============

  /**
   * Criar paciente no tenant
   */
  async createPaciente(tenantId, pacienteData) {
    try {
      const pacienteRef = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('pacientes')
        .add({
          ...pacienteData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      return { id: pacienteRef.id, ...pacienteData };
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      throw error;
    }
  }

  /**
   * Listar pacientes do tenant
   */
  async getPacientes(tenantId, filters = {}) {
    try {
      let query = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('pacientes');

      // Aplicar filtros
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.search) {
        // Busca por nome ou email (Firestore não suporta LIKE, usar filtro no cliente)
        query = query.orderBy('nome');
      }

      const snapshot = await query.get();
      let pacientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtrar por texto se necessário
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        pacientes = pacientes.filter(p => 
          p.nome?.toLowerCase().includes(searchTerm) ||
          p.email?.toLowerCase().includes(searchTerm) ||
          p.cpf?.includes(searchTerm) ||
          p.telefone?.includes(searchTerm)
        );
      }

      return pacientes;
    } catch (error) {
      console.error('Erro ao listar pacientes:', error);
      throw error;
    }
  }

  /**
   * Buscar paciente por ID
   */
  async getPacienteById(tenantId, pacienteId) {
    try {
      const doc = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('pacientes')
        .doc(pacienteId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      throw error;
    }
  }

  /**
   * Atualizar paciente
   */
  async updatePaciente(tenantId, pacienteId, updates) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('pacientes')
        .doc(pacienteId)
        .update({
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      throw error;
    }
  }

  /**
   * Deletar paciente
   */
  async deletePaciente(tenantId, pacienteId) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('pacientes')
        .doc(pacienteId)
        .delete();

      return true;
    } catch (error) {
      console.error('Erro ao deletar paciente:', error);
      throw error;
    }
  }

  // ============ MÉTODOS PARA TRIAL ============

  /**
   * Criar trial tenant
   */
  async createTrialTenant(trialData) {
    try {
      const tenantRef = await this.db.collection('tenants').add({
        ...trialData,
        status: 'trial',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { id: tenantRef.id, ...trialData };
    } catch (error) {
      console.error('Erro ao criar trial tenant:', error);
      throw error;
    }
  }

  /**
   * Verificar se slug existe
   */
  async slugExists(slug) {
    try {
      const snapshot = await this.db.collection('tenants')
        .where('slug', '==', slug)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar slug:', error);
      throw error;
    }
  }

  // ============ MÉTODOS PARA TENANTS ADMIN ============

  /**
   * Listar todos os tenants
   */
  async getAllTenants(filters = {}) {
    try {
      let query = this.db.collection('tenants');

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      query = query.orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erro ao listar tenants:', error);
      throw error;
    }
  }

  /**
   * Buscar tenant por ID
   */
  async getTenantById(tenantId) {
    try {
      const doc = await this.db.collection('tenants').doc(tenantId).get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Erro ao buscar tenant:', error);
      throw error;
    }
  }

  /**
   * Atualizar tenant
   */
  async updateTenant(tenantId, updates) {
    try {
      await this.db.collection('tenants')
        .doc(tenantId)
        .update({
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar tenant:', error);
      throw error;
    }
  }

  /**
   * Deletar tenant
   */
  async deleteTenant(tenantId) {
    try {
      // Deletar todas as subcoleções primeiro
      const collections = ['usuarios', 'pacientes', 'agendamentos', 'profissionais', 'whatsapp_sessions', 'whatsapp_messages', 'whatsapp_contacts'];
      
      for (const collectionName of collections) {
        const snapshot = await this.db
          .collection('tenants')
          .doc(tenantId)
          .collection(collectionName)
          .get();

        const batch = this.db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Deletar o tenant
      await this.db.collection('tenants').doc(tenantId).delete();

      return true;
    } catch (error) {
      console.error('Erro ao deletar tenant:', error);
      throw error;
    }
  }

  // ============ MÉTODOS PARA USUÁRIOS AVANÇADOS ============

  /**
   * Listar usuários do tenant
   */
  async getUsers(tenantId, filters = {}) {
    try {
      let query = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('usuarios');

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.role) {
        query = query.where('papel', '==', filters.role);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }
  }

  /**
   * Buscar usuário por ID
   */
  async getUserById(tenantId, userId) {
    try {
      const doc = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('usuarios')
        .doc(userId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  }

  /**
   * Verificar se email já existe em algum tenant
   */
  async emailExistsInAnyTenant(email) {
    try {
      const tenants = await this.getActiveTenants();
      
      for (const tenant of tenants) {
        const user = await this.getUserByEmail(tenant.id, email);
        if (user) {
          return { exists: true, tenant, user };
        }
      }

      return { exists: false };
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      throw error;
    }
  }

  /**
   * Criar primeiro usuário admin do tenant
   */
  async createFirstAdminUser(tenantId, userData) {
    try {
      const userRef = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('usuarios')
        .add({
          ...userData,
          papel: 'admin',
          status: 'pending',
          email_verified_at: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      return { id: userRef.id, ...userData };
    } catch (error) {
      console.error('Erro ao criar primeiro admin:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE AGENDAMENTOS (AGENDA LITE) =====

  /**
   * Buscar agendamentos do tenant com filtros opcionais
   */
  async getAgendamentos(tenantId, filtros = {}) {
    try {
      let query = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('agendamentos');

      // Aplicar filtros
      if (filtros.data_inicio) {
        query = query.where('data', '>=', filtros.data_inicio);
      }
      if (filtros.data_fim) {
        query = query.where('data', '<=', filtros.data_fim);
      }

      // Ordenar por data e horário
      query = query.orderBy('data').orderBy('horario');

      const snapshot = await query.get();
      
      const agendamentos = [];
      snapshot.forEach(doc => {
        agendamentos.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return agendamentos;
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  }

  /**
   * Criar novo agendamento
   */
  async createAgendamento(tenantId, agendamentoData) {
    try {
      const agendamentoRef = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('agendamentos')
        .add({
          ...agendamentoData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return agendamentoRef.id;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  }

  /**
   * Atualizar agendamento existente
   */
  async updateAgendamento(tenantId, agendamentoId, agendamentoData) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('agendamentos')
        .doc(agendamentoId)
        .update({
          ...agendamentoData,
          updated_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw error;
    }
  }

  /**
   * Deletar agendamento
   */
  async deleteAgendamento(tenantId, agendamentoId) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('agendamentos')
        .doc(agendamentoId)
        .delete();

      return true;
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE GRADES DE HORÁRIOS PROFISSIONAIS =====

  /**
   * Buscar grades de horários de profissionais
   */
  async getProfessionalSchedules(tenantId, professionalId = null) {
    try {
      let query = this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('professional_schedules');

      if (professionalId) {
        query = query.where('professional_id', '==', parseInt(professionalId));
      }

      query = query.orderBy('day_of_week').orderBy('start_time');

      const snapshot = await query.get();
      
      const schedules = [];
      snapshot.forEach(doc => {
        schedules.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return schedules;
    } catch (error) {
      console.error('Erro ao buscar grades de horários:', error);
      throw error;
    }
  }

  /**
   * Criar nova grade de horário
   */
  async createProfessionalSchedule(tenantId, scheduleData) {
    try {
      const scheduleRef = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('professional_schedules')
        .add({
          ...scheduleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return scheduleRef.id;
    } catch (error) {
      console.error('Erro ao criar grade de horário:', error);
      throw error;
    }
  }

  /**
   * Atualizar grade de horário
   */
  async updateProfessionalSchedule(tenantId, scheduleId, scheduleData) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('professional_schedules')
        .doc(scheduleId)
        .update({
          ...scheduleData,
          updated_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar grade de horário:', error);
      throw error;
    }
  }

  /**
   * Deletar grade de horário
   */
  async deleteProfessionalSchedule(tenantId, scheduleId) {
    try {
      await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('professional_schedules')
        .doc(scheduleId)
        .delete();

      return true;
    } catch (error) {
      console.error('Erro ao deletar grade de horário:', error);
      throw error;
    }
  }

  /**
   * Deletar todas as grades de um profissional
   */
  async deleteAllProfessionalSchedules(tenantId, professionalId) {
    try {
      const snapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('professional_schedules')
        .where('professional_id', '==', parseInt(professionalId))
        .get();

      const batch = this.db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return snapshot.size;
    } catch (error) {
      console.error('Erro ao deletar todas as grades:', error);
      throw error;
    }
  }

  /**
   * Atualizar múltiplas grades (bulk update)
   */
  async bulkUpdateProfessionalSchedules(tenantId, schedules) {
    try {
      const batch = this.db.batch();
      const timestamp = new Date().toISOString();

      for (const schedule of schedules) {
        if (schedule.id) {
          // Atualizar existente
          const ref = this.db
            .collection('tenants')
            .doc(tenantId)
            .collection('professional_schedules')
            .doc(schedule.id);
          
          batch.update(ref, {
            ...schedule,
            updated_at: timestamp
          });
        } else {
          // Criar novo
          const ref = this.db
            .collection('tenants')
            .doc(tenantId)
            .collection('professional_schedules')
            .doc();
          
          batch.set(ref, {
            ...schedule,
            created_at: timestamp,
            updated_at: timestamp
          });
        }
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Erro no bulk update de grades:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE DASHBOARD =====

  /**
   * Buscar métricas do dashboard
   */
  async getDashboardMetrics(tenantId) {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeDateStr = hoje.toISOString().split('T')[0];
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];

      // Buscar todos os agendamentos (sem where para evitar erro de índice)
      const agendamentosSnapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('agendamentos')
        .get();

      let agendamentosHoje = 0;
      let receitaMensal = 0;

      agendamentosSnapshot.forEach(doc => {
        const data = doc.data();
        const dataAgendamento = data.data;
        
        // Contar agendamentos de hoje
        if (dataAgendamento === hojeDateStr) {
          agendamentosHoje++;
        }
        
        // Calcular receita do mês
        if (dataAgendamento && dataAgendamento >= inicioMes) {
          const valor = parseFloat(data.valor) || 0;
          receitaMensal += valor;
        }
      });

      // Buscar pacientes (sem where para evitar erro de índice)
      const pacientesSnapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('pacientes')
        .get();

      let pacientesAtivos = 0;
      pacientesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'ativo' || !data.status) {
          pacientesAtivos++;
        }
      });

      // Calcular taxa de ocupação (baseado em agendamentos vs horários disponíveis)
      const schedulesSnapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('professional_schedules')
        .get();

      const horariosDisponiveis = schedulesSnapshot.size * 10; // Aproximação: 10 slots por horário
      const taxaOcupacao = horariosDisponiveis > 0 
        ? Math.round((agendamentosHoje / horariosDisponiveis) * 100)
        : 0;

      return {
        todayAppointments: { value: agendamentosHoje, variation: 0 },
        activePatients: { value: pacientesAtivos, variation: 0 },
        monthlyRevenue: { value: `R$ ${(receitaMensal / 1000).toFixed(1)}k`, variation: 0 },
        occupationRate: { value: `${taxaOcupacao}%`, variation: 0 }
      };
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      // Retornar valores zerados em caso de erro ao invés de lançar exceção
      return {
        todayAppointments: { value: 0, variation: 0 },
        activePatients: { value: 0, variation: 0 },
        monthlyRevenue: { value: 'R$ 0k', variation: 0 },
        occupationRate: { value: '0%', variation: 0 }
      };
    }
  }

  /**
   * Buscar atividades recentes
   */
  async getDashboardActivities(tenantId) {
    try {
      // Por enquanto retorna array vazio - será implementado com sistema de logs
      // TODO: Implementar collection de 'activities' ou 'audit_log'
      return [];
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      throw error;
    }
  }

  /**
   * Buscar agendamentos do dia
   */
  async getDashboardAppointments(tenantId) {
    try {
      const hoje = new Date().toISOString().split('T')[0];

      const snapshot = await this.db
        .collection('tenants')
        .doc(tenantId)
        .collection('agendamentos')
        .where('data', '==', hoje)
        .limit(20)
        .get();

      let agendamentos = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        agendamentos.push({
          id: doc.id,
          paciente: data.paciente,
          procedimento: data.procedimento,
          horario: data.horario,
          status: data.status || 'pendente',
          avatar: data.paciente ? data.paciente.substring(0, 2).toUpperCase() : 'PA'
        });
      });

      // Ordenar localmente por horário
      agendamentos.sort((a, b) => {
        if (!a.horario) return 1;
        if (!b.horario) return -1;
        return a.horario.localeCompare(b.horario);
      });

      return agendamentos.slice(0, 10);
    } catch (error) {
      console.error('Erro ao buscar agendamentos do dashboard:', error);
      return []; // Retornar array vazio ao invés de throw
    }
  }

  /**
   * Buscar dados para gráficos
   */
  async getDashboardChartData(tenantId) {
    try {
      const hoje = new Date();
      const meses = [];
      const agendamentosPorMes = [];
      const receitaPorMes = [];

      // Gerar últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesStr = data.toLocaleDateString('pt-BR', { month: 'short' });
        meses.push(mesStr.charAt(0).toUpperCase() + mesStr.slice(1));

        const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1).toISOString().split('T')[0];
        const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0).toISOString().split('T')[0];

        // Buscar agendamentos do mês
        const snapshot = await this.db
          .collection('tenants')
          .doc(tenantId)
          .collection('agendamentos')
          .where('data', '>=', inicioMes)
          .where('data', '<=', fimMes)
          .get();

        let receitaMes = 0;
        snapshot.forEach(doc => {
          const valor = doc.data().valor || 0;
          receitaMes += parseFloat(valor);
        });

        agendamentosPorMes.push(snapshot.size);
        receitaPorMes.push(receitaMes / 1000); // Converter para milhares
      }

      // Dados para gráfico de procedimentos
      // Por enquanto retorna vazio - seria necessário ter um campo 'procedimento' padronizado
      const procedimentosData = {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2
        }]
      };

      return {
        appointmentsRevenue: {
          labels: meses,
          datasets: [
            {
              label: 'Agendamentos',
              data: agendamentosPorMes,
              borderColor: 'rgb(53, 162, 235)',
              backgroundColor: 'rgba(53, 162, 235, 0.2)',
              yAxisID: 'y',
            },
            {
              label: 'Receita (R$ mil)',
              data: receitaPorMes,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              yAxisID: 'y1',
            }
          ]
        },
        procedures: procedimentosData
      };
    } catch (error) {
      console.error('Erro ao buscar dados dos gráficos:', error);
      throw error;
    }
  }
}

module.exports = new FirestoreService();
