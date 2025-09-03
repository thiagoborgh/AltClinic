import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from 'axios';

// Importar componentes do sistema principal
import Dashboard from '../../frontend/src/pages/Dashboard';
import Configuracoes from '../../frontend/src/pages/Configuracoes';
import PacientesManager from '../../frontend/src/components/pacientes/PacientesManager';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios;

// Theme para testes
const theme = createTheme();

// Wrapper para componentes React
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('📊 SAEE Frontend - Dashboard', () => {
  
  test('Deve renderizar dashboard principal', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  test('Deve exibir cards de estatísticas', async () => {
    // Mock da resposta da API
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          totalPacientes: 150,
          agendamentosHoje: 12,
          atendimentosRealizados: 8,
          proximosAgendamentos: 4
        }
      }
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });
});

describe('⚙️ SAEE Frontend - Configurações', () => {
  
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            user: 'test@test.com'
          },
          whatsapp: {
            api_key: 'test_key',
            connected: false
          }
        }
      }
    });
  });

  test('Deve renderizar página de configurações', async () => {
    render(
      <TestWrapper>
        <Configuracoes />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/configurações/i)).toBeInTheDocument();
    });
  });

  test('Deve carregar seções de configuração', async () => {
    render(
      <TestWrapper>
        <Configuracoes />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText(/whatsapp/i)).toBeInTheDocument();
    });
  });

  test('Deve permitir editar configurações SMTP', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true }
    });

    render(
      <TestWrapper>
        <Configuracoes />
      </TestWrapper>
    );

    await waitFor(() => {
      const hostInput = screen.getByDisplayValue('smtp.gmail.com');
      expect(hostInput).toBeInTheDocument();
    });

    // Simular edição
    const hostInput = screen.getByDisplayValue('smtp.gmail.com');
    fireEvent.change(hostInput, { target: { value: 'smtp.outlook.com' } });

    const saveButton = screen.getByText(/salvar/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });
  });
});

describe('👥 SAEE Frontend - Pacientes', () => {
  
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: 1,
            nome: 'João Silva',
            email: 'joao@email.com',
            telefone: '11999999999',
            cpf: '12345678901'
          },
          {
            id: 2,
            nome: 'Maria Santos',
            email: 'maria@email.com',
            telefone: '11888888888',
            cpf: '10987654321'
          }
        ]
      }
    });
  });

  test('Deve renderizar lista de pacientes', async () => {
    render(
      <TestWrapper>
        <PacientesManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });
  });

  test('Deve permitir buscar pacientes', async () => {
    render(
      <TestWrapper>
        <PacientesManager />
      </TestWrapper>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/buscar/i);
      expect(searchInput).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'João' } });

    // Verificar se a busca foi acionada
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('search=João')
      );
    });
  });

  test('Deve abrir modal de novo paciente', async () => {
    render(
      <TestWrapper>
        <PacientesManager />
      </TestWrapper>
    );

    await waitFor(() => {
      const addButton = screen.getByText(/novo paciente/i);
      expect(addButton).toBeInTheDocument();
    });

    const addButton = screen.getByText(/novo paciente/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/cadastrar paciente/i)).toBeInTheDocument();
    });
  });
});

describe('📱 SAEE Frontend - WhatsApp', () => {
  
  test('Deve exibir QR Code quando desconectado', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { connected: false }
      }
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        }
      }
    });

    render(
      <TestWrapper>
        <Configuracoes />
      </TestWrapper>
    );

    await waitFor(() => {
      const connectButton = screen.getByText(/conectar whatsapp/i);
      fireEvent.click(connectButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/qr code/i)).toBeInTheDocument();
    });
  });

  test('Deve exibir status conectado', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          connected: true,
          phoneNumber: '+5511999999999'
        }
      }
    });

    render(
      <TestWrapper>
        <Configuracoes />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/conectado/i)).toBeInTheDocument();
      expect(screen.getByText('+5511999999999')).toBeInTheDocument();
    });
  });
});

describe('📋 SAEE Frontend - Responsividade', () => {
  
  test('Deve adaptar layout para mobile', () => {
    // Simular viewport mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    window.dispatchEvent(new Event('resize'));

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Verificar se sidebar mobile está sendo usada
    expect(document.querySelector('.MuiDrawer-root')).toBeInTheDocument();
  });

  test('Deve adaptar cards para tablet', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    window.dispatchEvent(new Event('resize'));

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Verificar layout responsivo
    const container = document.querySelector('.MuiContainer-root');
    expect(container).toBeInTheDocument();
  });
});
