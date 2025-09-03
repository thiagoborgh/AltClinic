import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from 'axios';

// Importar componentes da intranet
import Login from '../../admin/frontend/src/components/Login';
import Dashboard from '../../admin/frontend/src/pages/Dashboard';
import Licencas from '../../admin/frontend/src/pages/Licencas';
import Configuracoes from '../../admin/frontend/src/pages/Configuracoes';
import { AuthProvider } from '../../admin/frontend/src/contexts/AuthContext';

jest.mock('axios');
const mockedAxios = axios;

const theme = createTheme();

const TestWrapper = ({ children, authenticated = true }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('🏢 INTRANET Frontend - Login', () => {
  
  test('Deve renderizar formulário de login', () => {
    render(
      <TestWrapper authenticated={false}>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
  });

  test('Deve fazer login com sucesso', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 'fake-jwt-token',
        user: {
          id: 1,
          email: 'admin@altclinic.com',
          nome: 'Admin',
          role: 'super_admin'
        }
      }
    });

    render(
      <TestWrapper authenticated={false}>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const loginButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'admin@altclinic.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin123!' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        {
          email: 'admin@altclinic.com',
          password: 'Admin123!'
        }
      );
    });
  });

  test('Deve exibir erro com credenciais inválidas', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          success: false,
          error: 'Credenciais inválidas'
        }
      }
    });

    render(
      <TestWrapper authenticated={false}>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const loginButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'admin@altclinic.com' } });
    fireEvent.change(passwordInput, { target: { value: 'senha-errada' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });
});

describe('🏢 INTRANET Frontend - Dashboard', () => {
  
  beforeEach(() => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/dashboard/stats')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              totalLicencas: 45,
              licencasAtivas: 38,
              licencasVencendo: 4,
              licencasVencidas: 3,
              faturamentoMensal: 12450.50,
              crescimentoMensal: 15.2
            }
          }
        });
      }
      if (url.includes('/dashboard/alerts')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              alerts: [
                {
                  id: 1,
                  type: 'warning',
                  title: 'Licenças vencendo',
                  message: '4 licenças vencem nos próximos 30 dias',
                  count: 4
                }
              ]
            }
          }
        });
      }
      return Promise.resolve({ data: { success: true, data: {} } });
    });
  });

  test('Deve renderizar dashboard executivo', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument(); // Total licenças
      expect(screen.getByText('38')).toBeInTheDocument(); // Licenças ativas
    });
  });

  test('Deve exibir alertas importantes', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/licenças vencendo/i)).toBeInTheDocument();
      expect(screen.getByText(/4 licenças vencem/i)).toBeInTheDocument();
    });
  });

  test('Deve exibir gráficos de faturamento', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/R\$ 12\.450,50/)).toBeInTheDocument();
      expect(screen.getByText(/15\.2%/)).toBeInTheDocument();
    });
  });
});

describe('🏢 INTRANET Frontend - Licenças', () => {
  
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          licencas: [
            {
              id: 'lic_001',
              nome_clinica: 'Clínica São João',
              email: 'admin@clinicasaojoao.com',
              plano: 'premium',
              status: 'ativa',
              data_vencimento: '2025-12-31',
              valor_mensal: 299.90
            },
            {
              id: 'lic_002',
              nome_clinica: 'Clínica Santa Maria',
              email: 'admin@clinicasantamaria.com',
              plano: 'basic',
              status: 'vencendo',
              data_vencimento: '2025-09-15',
              valor_mensal: 199.90
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        }
      }
    });
  });

  test('Deve renderizar lista de licenças', async () => {
    render(
      <TestWrapper>
        <Licencas />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Clínica São João')).toBeInTheDocument();
      expect(screen.getByText('Clínica Santa Maria')).toBeInTheDocument();
    });
  });

  test('Deve permitir filtrar licenças', async () => {
    render(
      <TestWrapper>
        <Licencas />
      </TestWrapper>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/buscar licenças/i);
      expect(searchInput).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar licenças/i);
    fireEvent.change(searchInput, { target: { value: 'São João' } });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('search=São João')
      );
    });
  });

  test('Deve exibir status das licenças', async () => {
    render(
      <TestWrapper>
        <Licencas />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/ativa/i)).toBeInTheDocument();
      expect(screen.getByText(/vencendo/i)).toBeInTheDocument();
    });
  });

  test('Deve permitir criar nova licença', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true }
    });

    render(
      <TestWrapper>
        <Licencas />
      </TestWrapper>
    );

    await waitFor(() => {
      const addButton = screen.getByText(/nova licença/i);
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/criar licença/i)).toBeInTheDocument();
    });
  });
});

describe('🏢 INTRANET Frontend - Configurações por Licença', () => {
  
  beforeEach(() => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/configuracoes/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              licencaId: 'lic_001',
              configuracoes: {
                smtp: {
                  host: 'smtp.clinica.com',
                  port: 587,
                  user: 'noreply@clinica.com',
                  password: '***'
                },
                whatsapp: {
                  api_key: 'wpp_***',
                  connected: true,
                  phoneNumber: '+5511999999999'
                }
              }
            }
          }
        });
      }
      if (url.includes('/licencas')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              licencas: [
                {
                  id: 'lic_001',
                  nome_clinica: 'Clínica São João'
                }
              ]
            }
          }
        });
      }
      return Promise.resolve({ data: { success: true, data: {} } });
    });
  });

  test('Deve renderizar configurações por licença', async () => {
    render(
      <TestWrapper>
        <Configuracoes />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/configurações/i)).toBeInTheDocument();
    });
  });

  test('Deve carregar configurações de licença selecionada', async () => {
    render(
      <TestWrapper>
        <Configuracoes />
      </TestWrapper>
    );

    await waitFor(() => {
      const licencaSelect = screen.getByText(/selecionar licença/i);
      fireEvent.click(licencaSelect);
    });

    await waitFor(() => {
      const licencaOption = screen.getByText('Clínica São João');
      fireEvent.click(licencaOption);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('smtp.clinica.com')).toBeInTheDocument();
    });
  });

  test('Deve permitir editar configurações', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true }
    });

    render(
      <TestWrapper>
        <Configuracoes />
      </TestWrapper>
    );

    // Simular seleção de licença primeiro
    await waitFor(() => {
      const hostInput = screen.getByDisplayValue('smtp.clinica.com');
      fireEvent.change(hostInput, { target: { value: 'smtp.novoemail.com' } });
    });

    const saveButton = screen.getByText(/salvar/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });
  });

  test('Deve mascarar dados sensíveis', async () => {
    render(
      <TestWrapper>
        <Configuracoes />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('***')).toBeInTheDocument(); // Senha mascarada
      expect(screen.getByDisplayValue('wpp_***')).toBeInTheDocument(); // API key mascarada
    });
  });
});

describe('🏢 INTRANET Frontend - Navegação', () => {
  
  test('Deve navegar entre páginas', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const licencasLink = screen.getByText(/licenças/i);
      expect(licencasLink).toBeInTheDocument();
    });
  });

  test('Deve exibir informações do usuário logado', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/admin@altclinic.com/i)).toBeInTheDocument();
    });
  });

  test('Deve permitir logout', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true }
    });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      const logoutButton = screen.getByText(/sair/i);
      fireEvent.click(logoutButton);
    });

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout')
      );
    });
  });
});
