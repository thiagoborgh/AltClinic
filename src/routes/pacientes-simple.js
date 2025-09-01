const express = require('express');
const router = express.Router();

// Dados mock para desenvolvimento
const mockPacientes = [
  {
    id: 1,
    nome: 'Maria Silva Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 99999-1234',
    cpf: '123.456.789-01',
    dataNascimento: '1985-03-15',
    endereco: {
      logradouro: 'Rua das Flores, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567'
    },
    estadoCivil: 'Casada',
    profissao: 'Engenheira',
    convenio: {
      nome: 'Unimed',
      numero: '123456789'
    },
    observacoes: 'Paciente regular, sem restrições',
    criadoEm: '2024-01-15T10:30:00Z',
    ultimoAtendimento: '2024-08-15T14:20:00Z',
    status: 'ativo'
  },
  {
    id: 2,
    nome: 'João Pedro Oliveira',
    email: 'joao.oliveira@email.com',
    telefone: '(11) 88888-5678',
    cpf: '987.654.321-09',
    dataNascimento: '1978-07-22',
    endereco: {
      logradouro: 'Av. Paulista, 456',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100'
    },
    estadoCivil: 'Solteiro',
    profissao: 'Advogado',
    convenio: {
      nome: 'Bradesco Saúde',
      numero: '987654321'
    },
    observacoes: 'Primeira consulta agendada',
    criadoEm: '2024-02-20T09:15:00Z',
    ultimoAtendimento: '2024-08-22T16:30:00Z',
    status: 'ativo'
  },
  {
    id: 3,
    nome: 'Ana Carolina Lima',
    email: 'ana.lima@email.com',
    telefone: '(11) 77777-9999',
    cpf: '456.789.123-45',
    dataNascimento: '1992-11-08',
    endereco: {
      logradouro: 'Rua Augusta, 789',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01305-000'
    },
    estadoCivil: 'Solteira',
    profissao: 'Designer',
    convenio: {
      nome: 'SulAmérica',
      numero: '456789123'
    },
    observacoes: 'Paciente VIP',
    criadoEm: '2024-03-10T11:45:00Z',
    ultimoAtendimento: '2024-08-25T09:00:00Z',
    status: 'ativo'
  }
];

/**
 * @route GET /api/pacientes
 * @desc Lista todos os pacientes
 */
router.get('/', (req, res) => {
  try {
    const pacientesFormatados = mockPacientes.map(p => ({
      ...p,
      idade: new Date().getFullYear() - new Date(p.dataNascimento).getFullYear()
    }));

    res.json({
      success: true,
      pacientes: pacientesFormatados,
      total: pacientesFormatados.length,
      page: 1,
      totalPages: 1
    });
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route GET /api/pacientes/:id
 * @desc Busca paciente por ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const paciente = mockPacientes.find(p => p.id.toString() === id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    const pacienteFormatado = {
      ...paciente,
      idade: new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()
    };

    res.json({
      success: true,
      paciente: pacienteFormatado
    });
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/pacientes/buscar
 * @desc Busca pacientes por termo
 */
router.post('/buscar', (req, res) => {
  try {
    const { termo } = req.body;
    
    if (!termo || termo.length < 3) {
      return res.json({
        success: true,
        pacientes: []
      });
    }

    const pacientesFiltrados = mockPacientes.filter(p => 
      p.nome.toLowerCase().includes(termo.toLowerCase()) ||
      p.email.toLowerCase().includes(termo.toLowerCase()) ||
      p.telefone.includes(termo) ||
      p.cpf.includes(termo)
    );

    const pacientesFormatados = pacientesFiltrados.map(p => ({
      ...p,
      idade: new Date().getFullYear() - new Date(p.dataNascimento).getFullYear()
    }));

    res.json({
      success: true,
      pacientes: pacientesFormatados
    });
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/pacientes/verificar-duplicatas
 * @desc Verifica duplicatas de CPF ou telefone
 */
router.post('/verificar-duplicatas', (req, res) => {
  try {
    const { cpf, telefone } = req.body;
    
    const duplicataCpf = mockPacientes.find(p => p.cpf === cpf);
    const duplicataTelefone = mockPacientes.find(p => p.telefone === telefone);

    res.json({
      success: true,
      duplicatas: {
        cpf: duplicataCpf ? duplicataCpf.nome : null,
        telefone: duplicataTelefone ? duplicataTelefone.nome : null
      }
    });
  } catch (error) {
    console.error('Erro ao verificar duplicatas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/pacientes
 * @desc Cria novo paciente
 */
router.post('/', (req, res) => {
  try {
    const novoPaciente = {
      id: mockPacientes.length + 1,
      ...req.body,
      criadoEm: new Date().toISOString(),
      status: 'ativo'
    };

    mockPacientes.push(novoPaciente);

    const pacienteFormatado = {
      ...novoPaciente,
      idade: new Date().getFullYear() - new Date(novoPaciente.dataNascimento).getFullYear()
    };

    res.status(201).json({
      success: true,
      paciente: pacienteFormatado,
      message: 'Paciente criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
