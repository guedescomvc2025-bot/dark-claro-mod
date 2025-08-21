const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3000;

// Habilitar CORS para todas as rotas
app.use(cors());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '.')));

// Proxy para a API do Xtream (para evitar CORS localmente)
app.use('/proxy', createProxyMiddleware({
  target: '',
  changeOrigin: true,
  pathRewrite: {
    '^/proxy': '', // remove /proxy da URL
  },
  onProxyReq: (proxyReq, req, res) => {
    // Adicione cabeçalhos necessários aqui, se necessário
  },
}));

// Redirecionar todas as outras requisições para o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});