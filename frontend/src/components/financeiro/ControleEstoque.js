import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Inventory,
  Add,
  Edit,
  Warning,
  CheckCircle,
  TrendingDown,
  ShoppingCart,
  Visibility,
  LocalShipping,
  Assignment
} from '@mui/icons-material';

const ControleEstoque = () => {
  const [modalProdutoOpen, setModalProdutoOpen] = useState(false);
  const [modalMovimentacaoOpen, setModalMovimentacaoOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    categoria: '',
    fornecedor: '',
    quantidadeAtual: 0,
    quantidadeMinima: 0,
    valorUnitario: 0,
    localizacao: '',
    observacoes: ''
  });

  // Dados simulados do estoque
  const produtos = [
    {
      id: 1,
      nome: 'Serum Vitamina C',
      categoria: 'Cosméticos',
      fornecedor: 'Beauty Supply Co.',
      quantidadeAtual: 5,
      quantidadeMinima: 10,
      valorUnitario: 89.90,
      localizacao: 'Prateleira A1',
      ultimaMovimentacao: '2024-01-10',
      status: 'baixo'
    },
    {
      id: 2,
      nome: 'Agulhas Descartáveis 30G',
      categoria: 'Material Médico',
      fornecedor: 'MedSupplies',
      quantidadeAtual: 200,
      quantidadeMinima: 50,
      valorUnitario: 0.35,
      localizacao: 'Armário B2',
      ultimaMovimentacao: '2024-01-12',
      status: 'adequado'
    },
    {
      id: 3,
      nome: 'Máscara Facial Hidratante',
      categoria: 'Cosméticos',
      fornecedor: 'Skin Care Brasil',
      quantidadeAtual: 0,
      quantidadeMinima: 5,
      valorUnitario: 45.00,
      localizacao: 'Prateleira A2',
      ultimaMovimentacao: '2024-01-08',
      status: 'esgotado'
    },
    {
      id: 4,
      nome: 'Protetor Solar FPS 60',
      categoria: 'Cosméticos',
      fornecedor: 'Beauty Supply Co.',
      quantidadeAtual: 25,
      quantidadeMinima: 10,
      valorUnitario: 65.00,
      localizacao: 'Prateleira A1',
      ultimaMovimentacao: '2024-01-14',
      status: 'adequado'
    },
    {
      id: 5,
      nome: 'Luvas Descartáveis (Caixa)',
      categoria: 'Material Médico',
      fornecedor: 'MedSupplies',
      quantidadeAtual: 8,
      quantidadeMinima: 15,
      valorUnitario: 28.50,
      localizacao: 'Armário B1',
      ultimaMovimentacao: '2024-01-11',
      status: 'baixo'
    }
  ];

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    const categoriaMatch = filtroCategoria === 'todos' || produto.categoria === filtroCategoria;
    const statusMatch = filtroStatus === 'todos' || produto.status === filtroStatus;
    return categoriaMatch && statusMatch;
  });

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const totalProdutos = produtos.length;
    const produtosEsgotados = produtos.filter(p => p.status === 'esgotado').length;
    const produtosBaixoEstoque = produtos.filter(p => p.status === 'baixo').length;
    const valorTotalEstoque = produtos.reduce((acc, p) => acc + (p.quantidadeAtual * p.valorUnitario), 0);
    
    return {
      totalProdutos,
      produtosEsgotados,
      produtosBaixoEstoque,
      valorTotalEstoque
    };
  };

  const stats = calcularEstatisticas();

  const getStatusColor = (status) => {
    switch (status) {
      case 'adequado': return 'success';
      case 'baixo': return 'warning';
      case 'esgotado': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'adequado': return <CheckCircle />;
      case 'baixo': return <Warning />;
      case 'esgotado': return <TrendingDown />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'adequado': return 'Adequado';
      case 'baixo': return 'Baixo Estoque';
      case 'esgotado': return 'Esgotado';
      default: return 'Desconhecido';
    }
  };

  const handleSalvarProduto = () => {
    // Simulação de salvamento
    alert('✅ Produto salvo com sucesso!');
    setModalProdutoOpen(false);
    setNovoProduto({
      nome: '',
      categoria: '',
      fornecedor: '',
      quantidadeAtual: 0,
      quantidadeMinima: 0,
      valorUnitario: 0,
      localizacao: '',
      observacoes: ''
    });
  };

  const gerarPedidoCompra = (produto) => {
    alert(`Gerando pedido de compra para: ${produto.nome}\nQuantidade sugerida: ${produto.quantidadeMinima * 2} unidades`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Controle de Estoque
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setModalProdutoOpen(true)}
          size="large"
        >
          Novo Produto
        </Button>
      </Box>

      {/* Alertas */}
      {stats.produtosEsgotados > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          ⚠️ {stats.produtosEsgotados} produto(s) esgotado(s) - Reabasteça urgentemente!
        </Alert>
      )}
      
      {stats.produtosBaixoEstoque > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {stats.produtosBaixoEstoque} produto(s) com baixo estoque - Considere fazer pedidos
        </Alert>
      )}

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'primary.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Inventory fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.totalProdutos}
              </Typography>
              <Typography variant="body2">
                Total de Produtos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'success.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                R$ {stats.valorTotalEstoque.toLocaleString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                Valor Total do Estoque
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'warning.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.produtosBaixoEstoque}
              </Typography>
              <Typography variant="body2">
                Baixo Estoque
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'error.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDown fontSize="large" sx={{ mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.produtosEsgotados}
              </Typography>
              <Typography variant="body2">
                Esgotados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Filtrar por Categoria"
                select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <MenuItem value="todos">Todas as Categorias</MenuItem>
                <MenuItem value="Cosméticos">Cosméticos</MenuItem>
                <MenuItem value="Material Médico">Material Médico</MenuItem>
                <MenuItem value="Equipamentos">Equipamentos</MenuItem>
                <MenuItem value="Limpeza">Limpeza</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Filtrar por Status"
                select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <MenuItem value="todos">Todos os Status</MenuItem>
                <MenuItem value="adequado">Estoque Adequado</MenuItem>
                <MenuItem value="baixo">Baixo Estoque</MenuItem>
                <MenuItem value="esgotado">Esgotado</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                startIcon={<Assignment />}
                fullWidth
              >
                Relatório de Estoque
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Produto</strong></TableCell>
              <TableCell><strong>Categoria</strong></TableCell>
              <TableCell><strong>Qtd. Atual</strong></TableCell>
              <TableCell><strong>Qtd. Mínima</strong></TableCell>
              <TableCell><strong>Valor Unit.</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Localização</strong></TableCell>
              <TableCell><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {produtosFiltrados.map((produto) => (
              <TableRow 
                key={produto.id}
                sx={{ 
                  backgroundColor: produto.status === 'esgotado' 
                    ? 'rgba(244, 67, 54, 0.1)' 
                    : produto.status === 'baixo' 
                    ? 'rgba(255, 193, 7, 0.1)' 
                    : 'transparent'
                }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {produto.nome}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {produto.fornecedor}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={produto.categoria} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={produto.quantidadeAtual <= produto.quantidadeMinima ? 'error' : 'text.primary'}
                  >
                    {produto.quantidadeAtual}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {produto.quantidadeMinima}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    R$ {produto.valorUnitario.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(produto.status)}
                    label={getStatusLabel(produto.status)}
                    color={getStatusColor(produto.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {produto.localizacao}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Visualizar">
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Editar">
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    
                    {(produto.status === 'baixo' || produto.status === 'esgotado') && (
                      <Tooltip title="Gerar Pedido">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => gerarPedidoCompra(produto)}
                        >
                          <ShoppingCart />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Movimentação">
                      <IconButton 
                        size="small" 
                        color="secondary"
                        onClick={() => {
                          setProdutoSelecionado(produto);
                          setModalMovimentacaoOpen(true);
                        }}
                      >
                        <LocalShipping />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Novo Produto */}
      <Dialog open={modalProdutoOpen} onClose={() => setModalProdutoOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Novo Produto</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Produto *"
                value={novoProduto.nome}
                onChange={(e) => setNovoProduto(prev => ({ ...prev, nome: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Categoria *"
                select
                value={novoProduto.categoria}
                onChange={(e) => setNovoProduto(prev => ({ ...prev, categoria: e.target.value }))}
              >
                <MenuItem value="Cosméticos">Cosméticos</MenuItem>
                <MenuItem value="Material Médico">Material Médico</MenuItem>
                <MenuItem value="Equipamentos">Equipamentos</MenuItem>
                <MenuItem value="Limpeza">Limpeza</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fornecedor"
                value={novoProduto.fornecedor}
                onChange={(e) => setNovoProduto(prev => ({ ...prev, fornecedor: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantidade Atual"
                type="number"
                value={novoProduto.quantidadeAtual}
                onChange={(e) => setNovoProduto(prev => ({ ...prev, quantidadeAtual: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantidade Mínima"
                type="number"
                value={novoProduto.quantidadeMinima}
                onChange={(e) => setNovoProduto(prev => ({ ...prev, quantidadeMinima: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Valor Unitário (R$)"
                type="number"
                value={novoProduto.valorUnitario}
                onChange={(e) => setNovoProduto(prev => ({ ...prev, valorUnitario: parseFloat(e.target.value) || 0 }))}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Localização no Estoque"
                value={novoProduto.localizacao}
                onChange={(e) => setNovoProduto(prev => ({ ...prev, localizacao: e.target.value }))}
                placeholder="Ex: Prateleira A1, Armário B2"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={novoProduto.observacoes}
                onChange={(e) => setNovoProduto(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalProdutoOpen(false)}>Cancelar</Button>
          <Button onClick={handleSalvarProduto} variant="contained">
            Salvar Produto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Movimentação */}
      <Dialog open={modalMovimentacaoOpen} onClose={() => setModalMovimentacaoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Movimentação de Estoque</DialogTitle>
        <DialogContent>
          {produtoSelecionado && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Produto: <strong>{produtoSelecionado.nome}</strong><br />
                Estoque Atual: <strong>{produtoSelecionado.quantidadeAtual} unidades</strong>
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tipo de Movimentação"
                    select
                    defaultValue="entrada"
                  >
                    <MenuItem value="entrada">Entrada (Compra/Recebimento)</MenuItem>
                    <MenuItem value="saida">Saída (Venda/Uso)</MenuItem>
                    <MenuItem value="ajuste">Ajuste de Inventário</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Quantidade"
                    type="number"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Motivo/Observação"
                    multiline
                    rows={3}
                    placeholder="Descreva o motivo da movimentação..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalMovimentacaoOpen(false)}>Cancelar</Button>
          <Button variant="contained">
            Registrar Movimentação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ControleEstoque;
