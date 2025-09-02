import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Upload as UploadIcon,
  Edit as EditIcon,
  AutoAwesome as AIIcon,
  Download as DownloadIcon,
  Add as AddIcon
} from '@mui/icons-material';

export default function ImagensTab({ prontuario, onAdicionarImagem }) {
  const [imagens, setImagens] = useState(prontuario?.imagens || []);
  const [modalVisualizacao, setModalVisualizacao] = useState(null);
  const [modalUpload, setModalUpload] = useState(false);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [analiseIA, setAnaliseIA] = useState(null);
  const fileInputRef = useRef();
  const cameraInputRef = useRef();

  const [novaImagem, setNovaImagem] = useState({
    arquivo: null,
    preview: null,
    descricao: '',
    categoria: 'antes',
    tags: []
  });

  const categorias = ['antes', 'durante', 'depois', 'raio-x', 'exame', 'documento'];
  const tagsComuns = ['face', 'corpo', 'cicatriz', 'procedimento', 'resultado', 'comparativo'];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo e tamanho
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('Arquivo muito grande. Tamanho máximo: 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setNovaImagem(prev => ({
          ...prev,
          arquivo: file,
          preview: e.target.result
        }));
        setModalUpload(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const salvarImagem = () => {
    const imagemCompleta = {
      id: Date.now(),
      nome: novaImagem.arquivo.name,
      url: novaImagem.preview, // Em produção, seria a URL do servidor
      descricao: novaImagem.descricao,
      categoria: novaImagem.categoria,
      tags: novaImagem.tags,
      dataUpload: new Date().toISOString(),
      tamanho: novaImagem.arquivo.size,
      tipo: novaImagem.arquivo.type,
      criptografada: true // Indicar que foi criptografada no backend
    };

    const novasImagens = [...imagens, imagemCompleta];
    setImagens(novasImagens);
    onAdicionarImagem(imagemCompleta);
    
    setModalUpload(false);
    setNovaImagem({
      arquivo: null,
      preview: null,
      descricao: '',
      categoria: 'antes',
      tags: []
    });
  };

  const analisarImagemIA = async (imagem) => {
    setAnalisandoIA(true);
    try {
      // Simular análise de IA da imagem (Gemini Vision)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const analise = {
        deteccoes: [
          { tipo: 'area_tratamento', confianca: 0.92, coordenadas: { x: 120, y: 80, w: 200, h: 150 } },
          { tipo: 'cicatriz', confianca: 0.78, coordenadas: { x: 180, y: 120, w: 50, h: 20 } }
        ],
        medidas: {
          area_total: '15.2 cm²',
          circunferencia: '18.4 cm',
          mudanca_percentual: '-12.5%'
        },
        sugestoes: [
          'Evolução positiva comparada à imagem anterior',
          'Cicatrização dentro do esperado',
          'Considere foto de comparação lateral'
        ],
        categoria_sugerida: 'resultado',
        tags_sugeridas: ['evolucao', 'cicatrizacao', 'pos-procedimento']
      };
      
      setAnaliseIA(analise);
    } catch (error) {
      console.error('Erro na análise de IA:', error);
    } finally {
      setAnalisandoIA(false);
    }
  };

  const adicionarTag = (tag) => {
    if (!novaImagem.tags.includes(tag)) {
      setNovaImagem(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removerTag = (tagParaRemover) => {
    setNovaImagem(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagParaRemover)
    }));
  };

  const baixarImagem = (imagem) => {
    const link = document.createElement('a');
    link.href = imagem.url;
    link.download = imagem.nome;
    link.click();
  };

  const agruparPorCategoria = () => {
    return categorias.reduce((grupos, categoria) => {
      grupos[categoria] = imagens.filter(img => img.categoria === categoria);
      return grupos;
    }, {});
  };

  const imagensAgrupadas = agruparPorCategoria();

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header com ações */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">
              Galeria de Imagens 
              <Chip 
                size="small" 
                label={imagens.length} 
                color="primary" 
                sx={{ ml: 1 }}
              />
            </Typography>
            <Box>
              <Button
                startIcon={<PhotoCameraIcon />}
                onClick={() => cameraInputRef.current?.click()}
                sx={{ mr: 1 }}
              >
                Câmera
              </Button>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload
              </Button>
            </Box>
          </Box>

          {analisandoIA && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Analisando imagem com IA...
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Análise de IA */}
        {analiseIA && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Análise de IA da Imagem
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Medidas Detectadas:</Typography>
                  {Object.entries(analiseIA.medidas).map(([medida, valor]) => (
                    <Typography key={medida} variant="body2">
                      • {medida.replace('_', ' ')}: {valor}
                    </Typography>
                  ))}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Sugestões:</Typography>
                  {analiseIA.sugestoes.map((sugestao, index) => (
                    <Typography key={index} variant="body2">
                      • {sugestao}
                    </Typography>
                  ))}
                </Grid>
              </Grid>
            </Alert>
          </Grid>
        )}

        {/* Galeria por Categoria */}
        {Object.entries(imagensAgrupadas).map(([categoria, imagensCategoria]) => {
          if (imagensCategoria.length === 0) return null;

          return (
            <Grid item xs={12} key={categoria}>
              <Typography variant="h6" gutterBottom>
                {categoria.toUpperCase()} ({imagensCategoria.length})
              </Typography>
              <ImageList cols={4} gap={8}>
                {imagensCategoria.map((imagem) => (
                  <ImageListItem key={imagem.id}>
                    <img
                      src={imagem.url}
                      alt={imagem.descricao}
                      loading="lazy"
                      style={{ 
                        height: 200, 
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => setModalVisualizacao(imagem)}
                    />
                    <ImageListItemBar
                      title={imagem.descricao || 'Sem descrição'}
                      subtitle={new Date(imagem.dataUpload).toLocaleDateString('pt-BR')}
                      actionIcon={
                        <Box>
                          <IconButton
                            sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              analisarImagemIA(imagem);
                            }}
                          >
                            <AIIcon />
                          </IconButton>
                          <IconButton
                            sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Funcionalidade de edição pode ser implementada futuramente
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Box>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Grid>
          );
        })}

        {/* Mensagem quando não há imagens */}
        {imagens.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <PhotoCameraIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma imagem adicionada
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Adicione fotos do paciente para acompanhar a evolução dos tratamentos
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Adicionar Primeira Imagem
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Inputs de arquivo ocultos */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={cameraInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
      />

      {/* Modal de Upload */}
      <Dialog open={modalUpload} onClose={() => setModalUpload(false)} maxWidth="md" fullWidth>
        <DialogTitle>Adicionar Nova Imagem</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {novaImagem.preview && (
              <Grid item xs={12} md={6}>
                <img
                  src={novaImagem.preview}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }}
                />
              </Grid>
            )}
            <Grid item xs={12} md={novaImagem.preview ? 6 : 12}>
              <TextField
                fullWidth
                label="Descrição"
                value={novaImagem.descricao}
                onChange={(e) => setNovaImagem(prev => ({ ...prev, descricao: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                select
                label="Categoria"
                value={novaImagem.categoria}
                onChange={(e) => setNovaImagem(prev => ({ ...prev, categoria: e.target.value }))}
                sx={{ mb: 2 }}
              >
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>
                    {categoria.toUpperCase()}
                  </option>
                ))}
              </TextField>

              <Typography variant="subtitle2" gutterBottom>
                Tags Comuns:
              </Typography>
              <Box sx={{ mb: 2 }}>
                {tagsComuns.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    clickable
                    size="small"
                    color={novaImagem.tags.includes(tag) ? 'primary' : 'default'}
                    onClick={() => adicionarTag(tag)}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>

              {novaImagem.tags.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags Selecionadas:
                  </Typography>
                  {novaImagem.tags.map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => removerTag(tag)}
                      color="primary"
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalUpload(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarImagem}>
            Salvar Imagem
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog 
        open={!!modalVisualizacao} 
        onClose={() => setModalVisualizacao(null)}
        maxWidth="lg"
        fullWidth
      >
        {modalVisualizacao && (
          <>
            <DialogTitle>
              {modalVisualizacao.descricao || 'Imagem'}
              <IconButton
                sx={{ position: 'absolute', right: 8, top: 8 }}
                onClick={() => baixarImagem(modalVisualizacao)}
              >
                <DownloadIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <img
                src={modalVisualizacao.url}
                alt={modalVisualizacao.descricao}
                style={{ width: '100%', height: 'auto' }}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Categoria: {modalVisualizacao.categoria} | 
                  Data: {new Date(modalVisualizacao.dataUpload).toLocaleDateString('pt-BR')} |
                  Tamanho: {(modalVisualizacao.tamanho / 1024 / 1024).toFixed(2)} MB
                </Typography>
                {modalVisualizacao.tags && modalVisualizacao.tags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {modalVisualizacao.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </Box>
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
