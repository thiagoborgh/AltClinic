import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  LinearProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  PhotoCamera as PhotoIcon,
  Compare as CompareIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Add as AddIcon,
  CalendarToday as DateIcon,
  Label as LabelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ImagemComparacaoViewer = ({ pacienteId, prontuario, imagens = [], onImagemAdicionada, onRecarregarImagens }) => {
  const [modalUpload, setModalUpload] = useState(false);
  const [modalComparacao, setModalComparacao] = useState(false);
  const [modalVisualizacao, setModalVisualizacao] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [imagensComparar, setImagensComparar] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');
  const [novaImagem, setNovaImagem] = useState({
    arquivo: null,
    categoria: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    tags: []
  });

  const fileInputRef = useRef(null);

  const categorias = [
    'Antes do Tratamento',
    'Durante o Tratamento',
    'Depois do Tratamento',
    'Evolução',
    'Complicação',
    'Resultado Final',
    'Documentação Médica',
    'Exame Complementar'
  ];

  const tagsDisponiveis = [
    'frontal', 'lateral', 'perfil', 'close-up', 'corpo-inteiro',
    'rosto', 'corpo', 'braços', 'pernas', 'abdomen', 'costas',
    'manchas', 'rugas', 'cicatrizes', 'textura', 'coloração'
  ];

  // Upload de nova imagem
  const handleUpload = async () => {
    if (!novaImagem.arquivo || !novaImagem.categoria) {
      setErro('Arquivo e categoria são obrigatórios');
      return;
    }

    setUploading(true);
    setErro('');

    try {
      const formData = new FormData();
      formData.append('imagem', novaImagem.arquivo);
      formData.append('pacienteId', pacienteId);
      formData.append('categoria', novaImagem.categoria);
      formData.append('descricao', novaImagem.descricao);
      formData.append('data', novaImagem.data);
      formData.append('tags', JSON.stringify(novaImagem.tags));

      const response = await fetch('/api/prontuario/imagem/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro no upload da imagem');
      }

      const result = await response.json();
      const novaImagemData = {
        id: result.id,
        url: result.url,
        categoria: novaImagem.categoria,
        descricao: novaImagem.descricao,
        data: novaImagem.data,
        tags: novaImagem.tags,
        criadoEm: new Date().toISOString()
      };

      if (onImagemAdicionada) {
        onImagemAdicionada(novaImagemData);
      }

      if (onRecarregarImagens) {
        onRecarregarImagens();
      }

      setModalUpload(false);
      resetFormulario();
    } catch (error) {
      setErro(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Reset do formulário
  const resetFormulario = () => {
    setNovaImagem({
      arquivo: null,
      categoria: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      tags: []
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Selecionar arquivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setErro('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setErro('Apenas arquivos de imagem são permitidos.');
        return;
      }

      setNovaImagem(prev => ({ ...prev, arquivo: file }));
      setErro('');
    }
  };

  // Remover imagem
  const handleRemoverImagem = async (imagemId) => {
    try {
      const response = await fetch(`/api/prontuario/imagem/${imagemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao remover imagem');
      }

      if (onRecarregarImagens) {
        onRecarregarImagens();
      }
    } catch (error) {
      setErro(error.message);
    }
  };

  // Adicionar/remover tag
  const handleToggleTag = (tag) => {
    setNovaImagem(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Abrir comparação
  const handleAbrirComparacao = () => {
    setImagensComparar([]);
    setModalComparacao(true);
  };

  // Selecionar imagem para comparação
  const handleSelecionarParaComparacao = (imagem) => {
    if (imagensComparar.length >= 4) {
      setErro('Máximo 4 imagens para comparação');
      return;
    }
    
    if (imagensComparar.find(img => img.id === imagem.id)) {
      setImagensComparar(prev => prev.filter(img => img.id !== imagem.id));
    } else {
      setImagensComparar(prev => [...prev, imagem]);
    }
  };

  // Agrupar imagens por categoria
  const imagensPorCategoria = imagens.reduce((acc, imagem) => {
    const categoria = imagem.categoria || 'Sem Categoria';
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(imagem);
    return acc;
  }, {});

  // Renderizar grid de imagens
  const renderImagemGrid = (imagensList, showSelection = false) => (
    <Grid container spacing={2}>
      {imagensList.map((imagem) => (
        <Grid item xs={12} sm={6} md={4} key={imagem.id}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: showSelection && imagensComparar.find(img => img.id === imagem.id) 
                ? '2px solid' 
                : '1px solid',
              borderColor: showSelection && imagensComparar.find(img => img.id === imagem.id)
                ? 'primary.main'
                : 'divider'
            }}
            onClick={() => showSelection 
              ? handleSelecionarParaComparacao(imagem)
              : setImagemSelecionada(imagem)
            }
          >
            <Box 
              sx={{ 
                height: 200, 
                backgroundImage: `url(${imagem.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              {showSelection && imagensComparar.find(img => img.id === imagem.id) && (
                <Chip 
                  label="Selecionada" 
                  color="primary" 
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                />
              )}
            </Box>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {imagem.categoria}
              </Typography>
              {imagem.descricao && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {imagem.descricao}
                </Typography>
              )}
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(imagem.data), 'dd/MM/yyyy', { locale: ptBR })}
                </Typography>
                <Box>
                  <Tooltip title="Visualizar">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagemSelecionada(imagem);
                        setModalVisualizacao(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remover">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoverImagem(imagem.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {imagem.tags && imagem.tags.length > 0 && (
                <Box mt={1}>
                  {imagem.tags.map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={tag} 
                      size="small" 
                      variant="outlined" 
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      {/* Header com ações */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Imagens do Prontuário ({imagens.length})
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<PhotoIcon />}
            onClick={() => setModalUpload(true)}
          >
            Adicionar Imagem
          </Button>
          {imagens.length > 1 && (
            <Button
              variant="outlined"
              startIcon={<CompareIcon />}
              onClick={handleAbrirComparacao}
            >
              Comparar Imagens
            </Button>
          )}
        </Box>
      </Box>

      {erro && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
          {erro}
        </Alert>
      )}

      {/* Grid de imagens por categoria */}
      {Object.keys(imagensPorCategoria).length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PhotoIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma imagem adicionada
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Adicione imagens para documentar a evolução do tratamento
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalUpload(true)}
            >
              Adicionar Primeira Imagem
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(imagensPorCategoria).map(([categoria, imagensCategoria]) => (
          <Box key={categoria} mb={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LabelIcon />
              {categoria} ({imagensCategoria.length})
            </Typography>
            {renderImagemGrid(imagensCategoria)}
          </Box>
        ))
      )}

      {/* Modal de Upload */}
      <Dialog open={modalUpload} onClose={() => setModalUpload(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Adicionar Nova Imagem
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Upload de arquivo */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            <Button
              variant="outlined"
              fullWidth
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 3, height: 60 }}
            >
              {novaImagem.arquivo ? novaImagem.arquivo.name : 'Selecionar Imagem'}
            </Button>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={novaImagem.categoria}
                    onChange={(e) => setNovaImagem(prev => ({ ...prev, categoria: e.target.value }))}
                    label="Categoria"
                  >
                    {categorias.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data"
                  value={novaImagem.data}
                  onChange={(e) => setNovaImagem(prev => ({ ...prev, data: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={3}
                  value={novaImagem.descricao}
                  onChange={(e) => setNovaImagem(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva a imagem, procedimento realizado, observações..."
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags (clique para selecionar)
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {tagsDisponiveis.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onClick={() => handleToggleTag(tag)}
                      color={novaImagem.tags.includes(tag) ? 'primary' : 'default'}
                      variant={novaImagem.tags.includes(tag) ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Fazendo upload da imagem...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalUpload(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!novaImagem.arquivo || !novaImagem.categoria || uploading}
          >
            Adicionar Imagem
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Comparação */}
      <Dialog open={modalComparacao} onClose={() => setModalComparacao(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          Comparar Imagens ({imagensComparar.length}/4 selecionadas)
        </DialogTitle>
        <DialogContent>
          {imagensComparar.length === 0 ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                Selecione até 4 imagens para comparar:
              </Typography>
              {renderImagemGrid(imagens, true)}
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Comparação de Imagens
              </Typography>
              <Grid container spacing={2}>
                {imagensComparar.map((imagem, index) => (
                  <Grid item xs={12} sm={6} md={3} key={imagem.id}>
                    <Card>
                      <Box
                        sx={{
                          height: 300,
                          backgroundImage: `url(${imagem.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          {imagem.categoria}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(imagem.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </Typography>
                        {imagem.descricao && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {imagem.descricao}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box mt={3}>
                <Button
                  variant="outlined"
                  onClick={() => setImagensComparar([])}
                >
                  Limpar Seleção
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalComparacao(false)}>
            Fechar
          </Button>
          {imagensComparar.length > 0 && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // Implementar download da comparação
                console.log('Download comparação:', imagensComparar);
              }}
            >
              Salvar Comparação
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog 
        open={modalVisualizacao} 
        onClose={() => setModalVisualizacao(false)} 
        maxWidth="lg" 
        fullWidth
      >
        {imagemSelecionada && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  {imagemSelecionada.categoria}
                </Typography>
                <IconButton onClick={() => setModalVisualizacao(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 500,
                      backgroundImage: `url(${imagemSelecionada.url})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Data"
                        secondary={format(new Date(imagemSelecionada.data), 'dd/MM/yyyy', { locale: ptBR })}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Categoria"
                        secondary={imagemSelecionada.categoria}
                      />
                    </ListItem>
                    {imagemSelecionada.descricao && (
                      <>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="Descrição"
                            secondary={imagemSelecionada.descricao}
                          />
                        </ListItem>
                      </>
                    )}
                    {imagemSelecionada.tags && imagemSelecionada.tags.length > 0 && (
                      <>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary="Tags"
                            secondary={
                              <Box mt={1}>
                                {imagemSelecionada.tags.map((tag, index) => (
                                  <Chip 
                                    key={index} 
                                    label={tag} 
                                    size="small" 
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            }
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<DownloadIcon />}
                href={imagemSelecionada.url}
                download
              >
                Download
              </Button>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  handleRemoverImagem(imagemSelecionada.id);
                  setModalVisualizacao(false);
                }}
              >
                Remover
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ImagemComparacaoViewer;
