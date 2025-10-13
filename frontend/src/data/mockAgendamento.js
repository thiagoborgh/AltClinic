// Mock data para o sistema de agendamento
export const mockProcedimentos = [
  { id: 1, nome: 'Consulta', valor: 200.00, duracao: 30 },
  { id: 2, nome: 'Exame', valor: 150.00, duracao: 45 },
  { id: 3, nome: 'Cirurgia dentista (ortodontia)', valor: 500.00, duracao: 60 },
  { id: 4, nome: 'Limpeza', valor: 80.00, duracao: 30 },
  { id: 5, nome: 'Avaliação', valor: 120.00, duracao: 45 },
  { id: 6, nome: 'Retorno', valor: 100.00, duracao: 30 }
];

export const mockConvenios = [
  { id: 1, nome: 'Unimed' },
  { id: 2, nome: 'Bradesco Saúde' },
  { id: 3, nome: 'SulAmérica' },
  { id: 4, nome: 'Amil' },
  { id: 5, nome: 'NotreDame Intermédica' }
];

export const mockSalas = [
  { id: 1, nome: 'Sala 1' },
  { id: 2, nome: 'Sala 2' },
  { id: 3, nome: 'Consultório A' },
  { id: 4, nome: 'Consultório B' },
  { id: 5, nome: 'aa' } // Baseado na imagem
];

export const mockProfissionais = [
  { id: '1', nome: 'Dr. João Silva', especialidade: 'Clínico Geral' },
  { id: '2', nome: 'Dra. Maria Santos', especialidade: 'Pediatra' },
  { id: '3', nome: 'Dr. Carlos Lima', especialidade: 'Cardiologista' },
  { id: '4', nome: 'CAMILA PRODUTO', especialidade: 'Cirurgião dentista (ortodontia)' }
];

export const mockPacientes = [
  { id: 1, nome: 'João Silva', cpf: '123.456.789-00', telefone: '(11) 99999-9999', email: 'joao@email.com' },
  { id: 2, nome: 'Maria Santos', cpf: '987.654.321-00', telefone: '(11) 88888-8888', email: 'maria@email.com' },
  { id: 3, nome: 'Pedro Costa', cpf: '456.789.123-00', telefone: '(11) 77777-7777', email: 'pedro@email.com' },
  { id: 4, nome: 'Ana Oliveira', cpf: '789.123.456-00', telefone: '(11) 66666-6666', email: 'ana@email.com' },
  { id: 5, nome: 'Carlos Ferreira', cpf: '321.654.987-00', telefone: '(11) 55555-5555', email: 'carlos@email.com' }
];