const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy para streams de vídeo
app.use('/api/stream', createProxyMiddleware({
  target: 'http://localhost:8080', // URL do servidor Xtream (será substituída dinamicamente)
  changeOrigin: true,
  pathRewrite: {
    '^/api/stream': '', // Remove o prefixo /api/stream
  },
  onProxyReq: (proxyReq, req, res) => {
    // Extrai informações da URL
    const urlParts = req.url.split('/');
    const type = urlParts[3]; // live, vod ou series
    const username = urlParts[4];
    const password = urlParts[5];
    const streamId = urlParts[6].split('.')[0]; // Remove a extensão
    
    // Constrói a URL correta para o servidor Xtream
    const xtreamServer = req.headers['x-xtream-server'] || 'http://localhost:8080';
    let endpoint = '';
    
    if (type === 'live') {
      endpoint = `/live/${username}/${password}/${streamId}.m3u8`;
    } else if (type === 'vod') {
      endpoint = `/movie/${username}/${password}/${streamId}.mp4`;
    } else if (type === 'series') {
      endpoint = `/series/${username}/${password}/${streamId}.mp4`;
    }
    
    proxyReq.path = endpoint;
    proxyReq.setHeader('Host', new URL(xtreamServer).host);
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).send('Erro ao reproduzir o conteúdo');
  }
}));

// Rota para salvar a URL do servidor Xtream
app.post('/api/save-server', (req, res) => {
  const { serverUrl } = req.body;
  if (!serverUrl) {
    return res.status(400).json({ error: 'URL do servidor não fornecida' });
  }
  
  // Salva a URL do servidor em um cookie
  res.cookie('xtreamServer', serverUrl, { maxAge: 86400000, httpOnly: true });
  res.json({ success: true });
});

// Rota principal para servir o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
