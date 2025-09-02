import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Share as ShareIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';

export default function RelatoriosTab({ prontuario, onExportar }) {
  const [tipoRelatorio, setTipoRelatorio] = useState('completo');
  const [formatoExport, setFormatoExport] = useState('pdf');
  const [modalPreview, setModalPreview] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [relatorioGerado, setRelatorioGerado] = useState(null);

  const tiposRelatorio = [
    {
      valor: 'completo',
      label: 'Relatório Completo',
      descricao: 'Inclui anamnese, medições, imagens e histórico completo',
      itens: ['Dados pessoais', 'Anamnese', 'Evolução de medidas', 'Galeria de imagens', 'Histórico de atendimentos']
    },
    {
      valor: 'anamnese',
      label: 'Apenas Anamnese',
      descricao: 'Formulário de anamnese preenchido',
      itens: ['Dados pessoais', 'Histórico médico', 'Alergias', 'Medicamentos', 'Hábitos de vida']
    },
    {
      valor: 'evolucao',
      label: 'Evolução e Medidas',
      descricao: 'Gráficos e tabelas de evolução',
      itens: ['Medições por data', 'Gráficos de tendência', 'Análises de progresso', 'Variações percentuais']
    },
    {
      valor: 'imagens',
      label: 'Relatório Fotográfico',
      descricao: 'Galeria organizada por categoria',
      itens: ['Fotos antes/durante/depois', 'Comparativos', 'Anotações nas imagens', 'Timeline fotográfico']
    },
    {
      valor: 'resumo',
      label: 'Resumo Executivo',
      descricao: 'Visão geral para outros profissionais',
      itens: ['Dados principais', 'Últimas medições', 'Observações importantes', 'Recomendações']
    }
  ];

  const formatosExport = [
    { valor: 'pdf', label: 'PDF', icone: <PdfIcon />, descricao: 'Documento completo para impressão' },
    { valor: 'csv', label: 'CSV', icone: <CsvIcon />, descricao: 'Dados tabulares para análise' },
    { valor: 'json', label: 'JSON', icone: <ShareIcon />, descricao: 'Dados estruturados para integração' }
  ];

  const gerarRelatorio = async () => {
    setGerando(true);
    try {
      // Simular geração do relatório
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const relatorio = {
        tipo: tipoRelatorio,
        formato: formatoExport,
        dataGeracao: new Date().toISOString(),
        paciente: prontuario.paciente,
        conteudo: construirConteudoRelatorio(),
        tamanho: '2.3 MB',
        paginas: formatoExport === 'pdf' ? 12 : null,
        url: `#relatorio-${Date.now()}.${formatoExport}` // Simulado
      };
      
      setRelatorioGerado(relatorio);
      
      // Chamar callback para notificar o componente pai
      if (onExportar) {
        onExportar(relatorio);
      }
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setGerando(false);
    }
  };

  const construirConteudoRelatorio = () => {
    const relatorioSelecionado = tiposRelatorio.find(r => r.valor === tipoRelatorio);
    
    const conteudo = {
      cabecalho: {
        titulo: relatorioSelecionado.label,
        paciente: prontuario.paciente?.nome,
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
        clinica: 'AltClinic'
      },
      secoes: []
    };

    // Adicionar seções baseadas no tipo de relatório
    switch (tipoRelatorio) {
      case 'completo':
        conteudo.secoes = [
          { titulo: 'Dados Pessoais', dados: prontuario.paciente },
          { titulo: 'Anamnese', dados: prontuario.anamnese },
          { titulo: 'Evolução de Medidas', dados: prontuario.evolucoes },
          { titulo: 'Galeria de Imagens', dados: prontuario.imagens },
          { titulo: 'Histórico', dados: prontuario.historico }
        ];
        break;
      case 'anamnese':
        conteudo.secoes = [
          { titulo: 'Anamnese Completa', dados: prontuario.anamnese }
        ];
        break;
      case 'evolucao':
        conteudo.secoes = [
          { titulo: 'Medições e Evolução', dados: prontuario.evolucoes }
        ];
        break;
      case 'imagens':
        conteudo.secoes = [
          { titulo: 'Relatório Fotográfico', dados: prontuario.imagens }
        ];
        break;
      case 'resumo':
        conteudo.secoes = [
          { titulo: 'Resumo Executivo', dados: construirResumo() }
        ];
        break;
      default:
        break;
    }

    return conteudo;
  };

  const construirResumo = () => {
    return {
      paciente: prontuario.paciente?.nome,
      idade: prontuario.paciente?.idade,
      ultimaConsulta: prontuario.ultimoAtendimento,
      totalAtendimentos: prontuario.atendimentos?.length || 0,
      totalImagens: prontuario.imagens?.length || 0,
      evolucaoRecente: prontuario.evolucoes?.slice(-1)[0] || null,
      alertas: prontuario.anamnese?.alergias?.length > 0 ? ['Paciente possui alergias'] : []
    };
  };

  const baixarRelatorio = () => {
    if (relatorioGerado) {
      // Simular download
      const link = document.createElement('a');
      link.href = relatorioGerado.url;
      link.download = `relatorio-${prontuario.paciente?.nome}-${tipoRelatorio}.${formatoExport}`;
      link.click();
    }
  };

  const enviarPorEmail = () => {
    // Implementar envio por email
    console.log('Enviando relatório por email...');
  };

  const imprimir = () => {
    if (formatoExport === 'pdf') {
      window.print();
    }
  };

  const relatorioSelecionado = tiposRelatorio.find(r => r.valor === tipoRelatorio);

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Relatórios e Exportação
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gere relatórios personalizados do prontuário do paciente
          </Typography>
        </Grid>

        {/* Configuração do Relatório */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configurar Relatório
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Relatório</InputLabel>
                  <Select
                    value={tipoRelatorio}
                    onChange={(e) => setTipoRelatorio(e.target.value)}
                  >
                    {tiposRelatorio.map(tipo => (
                      <MenuItem key={tipo.valor} value={tipo.valor}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Formato de Exportação</InputLabel>
                  <Select
                    value={formatoExport}
                    onChange={(e) => setFormatoExport(e.target.value)}
                  >
                    {formatosExport.map(formato => (
                      <MenuItem key={formato.valor} value={formato.valor}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {formato.icone}
                          {formato.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={gerando ? <CircularProgress size={20} /> : <ReportIcon />}
                  onClick={gerarRelatorio}
                  disabled={gerando}
                  fullWidth
                >
                  {gerando ? 'Gerando Relatório...' : 'Gerar Relatório'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Preview do Relatório */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preview do Conteúdo
            </Typography>
            
            {relatorioSelecionado && (
              <Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {relatorioSelecionado.descricao}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Incluirá:
                </Typography>
                <List dense>
                  {relatorioSelecionado.itens.map((item, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        •
                      </ListItemIcon>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={`Formato: ${formatoExport.toUpperCase()}`}
                    color="primary"
                    size="small"
                  />
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Relatório Gerado */}
        {relatorioGerado && (
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Relatório gerado com sucesso!
            </Alert>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Relatório Pronto
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>{relatorioGerado.conteudo.cabecalho.titulo}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paciente: {relatorioGerado.paciente?.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gerado em: {new Date(relatorioGerado.dataGeracao).toLocaleString('pt-BR')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tamanho: {relatorioGerado.tamanho}
                    {relatorioGerado.paginas && ` • ${relatorioGerado.paginas} páginas`}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={baixarRelatorio}
                    >
                      Baixar
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<EmailIcon />}
                      onClick={enviarPorEmail}
                    >
                      Email
                    </Button>
                    {formatoExport === 'pdf' && (
                      <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={imprimir}
                      >
                        Imprimir
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Histórico de Relatórios */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Relatórios Recentes
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Histórico dos últimos relatórios gerados para este paciente aparecerá aqui.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Preview */}
      <Dialog open={modalPreview} onClose={() => setModalPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>Preview do Relatório</DialogTitle>
        <DialogContent>
          {/* Conteúdo do preview seria renderizado aqui */}
          <Typography variant="body1">
            Preview do relatório será exibido aqui...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalPreview(false)}>Fechar</Button>
          <Button variant="contained" onClick={gerarRelatorio}>
            Confirmar e Gerar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
