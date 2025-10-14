const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.LANDING_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Rota para servir a landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

// Rota específica para landing (fallback)
app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'landing-page',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Landing Page Server rodando na porta ${PORT}`);
  console.log(`📱 Landing Page: http://localhost:${PORT}/landing`);
  console.log(`🏠 Raiz: http://localhost:${PORT}/ (redireciona para landing)`);
  console.log(`🏥 Sistema médico: http://localhost:3001`);
  console.log(`🔧 Health check: http://localhost:${PORT}/health`);
});