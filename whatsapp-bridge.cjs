/**
 * NR Construções — WhatsApp Bridge
 * Ponte entre o agente WhatsApp (https://github.com/Hainrixz/whatsapp-agentkit)
 * e o Centro de Controle de Obras.
 *
 * Recebe webhooks do agentkit (POST /api/whatsapp/webhook), normaliza o payload
 * e o disponibiliza para o frontend via GET /api/whatsapp/messages (polling).
 *
 * Também serve a build estática (dist/) — assim você tem UM link de acesso externo
 * que entrega o sistema + a integração WhatsApp funcionando junto.
 *
 * Uso:
 *   1) npm run build        (gera a pasta dist/)
 *   2) node server/whatsapp-bridge.js
 *   3) Acesse http://localhost:8080
 *   4) Configure o whatsapp-agentkit para enviar POST em /api/whatsapp/webhook
 *
 * Não requer dependências externas (usa apenas o 'http' nativo do Node).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DIST = path.join(__dirname, '..', 'dist');
const STORE = path.join(__dirname, 'whatsapp-inbox.json');

// ---- persistência simples em arquivo ----
function loadInbox() {
  try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); } catch { return []; }
}
function saveInbox(list) {
  try { fs.writeFileSync(STORE, JSON.stringify(list, null, 2)); } catch (e) { console.error(e); }
}
let inbox = loadInbox();

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') return send(res, 204, '');

  // ---- WEBHOOK do agentkit ----
  if (url.pathname === '/api/whatsapp/webhook' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const p = JSON.parse(raw || '{}');
      // Normaliza diferentes formatos do agentkit
      const msg = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        from: p.from || p.phone || p.sender || p.number || 'desconhecido',
        nome: p.nome || p.name || p.pushName || p.contact || 'Contato WhatsApp',
        texto: p.texto || p.text || p.message || p.body || p.caption || '',
        midia: p.midia || p.media || p.image || p.imageBase64 || null,
        midiaTipo: p.midiaTipo || p.mediaType || (p.image ? 'image/jpeg' : null),
        data: new Date().toISOString(),
        lido: false,
        convertidoVistoriaId: null,
      };
      inbox.unshift(msg);
      saveInbox(inbox);
      console.log(`[WhatsApp] Nova mensagem de ${msg.nome} (${msg.from}): ${msg.texto.slice(0, 60)}`);
      return send(res, 200, JSON.stringify({ ok: true, id: msg.id }));
    } catch (e) {
      return send(res, 400, JSON.stringify({ ok: false, error: String(e) }));
    }
  }

  // ---- Polling do frontend ----
  if (url.pathname === '/api/whatsapp/messages' && req.method === 'GET') {
    return send(res, 200, JSON.stringify(inbox));
  }

  // ---- Limpar inbox (após o frontend importar) ----
  if (url.pathname === '/api/whatsapp/ack' && req.method === 'POST') {
    const raw = await readBody(req);
    try {
      const { ids } = JSON.parse(raw || '{}');
      inbox = inbox.filter((m) => !ids.includes(m.id));
      saveInbox(inbox);
    } catch { /* */ }
    return send(res, 200, JSON.stringify({ ok: true }));
  }

  // ---- health ----
  if (url.pathname === '/api/health') return send(res, 200, JSON.stringify({ ok: true, inbox: inbox.length }));

  // ---- arquivos estáticos (SPA) ----
  let filePath = path.join(DIST, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html'); // fallback SPA
  }
  fs.readFile(filePath, (err, content) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    const ext = path.extname(filePath);
    send(res, 200, content, MIME[ext] || 'application/octet-stream');
  });
});

server.listen(PORT, () => {
  console.log(`\n🏗  NR Construções — WhatsApp Bridge`);
  console.log(`➜  App:      http://localhost:${PORT}`);
  console.log(`➜  Webhook:  POST http://localhost:${PORT}/api/whatsapp/webhook`);
  console.log(`➜  Inbox:    GET  http://localhost:${PORT}/api/whatsapp/messages\n`);
});
