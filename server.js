/* Servidor LOCAL de desenvolvimento (não é usado na Vercel).
   Usa a mesma lógica dos handlers. Persiste em data/products.json.
   Rode:  node server.js   →  http://localhost:3000 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { handle } = require('./lib/handlers');
const { parseCookies } = require('./lib/auth');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

function rawBody(req){ return new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(d)); }); }

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  const query = Object.fromEntries(u.searchParams);
  const send = out => {
    if (out.setCookie) res.setHeader('Set-Cookie', out.setCookie);
    res.writeHead(out.status, { 'Content-Type':'application/json; charset=utf-8' });
    res.end(JSON.stringify(out.json));
  };

  if (p.startsWith('/api/')){
    const raw = await rawBody(req);
    const ct = req.headers['content-type'] || '';
    let jsonBody = null;
    if (ct.includes('json')){ try { jsonBody = raw ? JSON.parse(raw) : {}; } catch { jsonBody = {}; } }
    const cookies = parseCookies(req.headers.cookie);
    let route, params = {};
    if (p === '/api/login') route = 'login';
    else if (p === '/api/logout') route = 'logout';
    else if (p === '/api/me') route = 'me';
    else if (p === '/api/import') route = 'import';
    else if (p === '/api/products') route = 'products';
    else { const m = p.match(/^\/api\/products\/(.+)$/); if (m){ route = 'product'; params = { sku: decodeURIComponent(m[1]) }; } }
    if (!route) return send({ status:404, json:{ erro:'Rota não encontrada' } });
    return send(await handle({ route, method:req.method, cookies, jsonBody, rawBody:raw, contentType:ct, params, query }));
  }

  // estáticos
  let file = p === '/' ? 'catalogo.html' : p === '/admin' ? 'admin.html' : p.replace(/^\//,'');
  const full = path.join(ROOT, file);
  fs.readFile(full, (e, data) => {
    if (e){ res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(full);
    const t = ext==='.html' ? 'text/html; charset=utf-8' : ext==='.js' ? 'text/javascript' : ext==='.json' ? 'application/json' : 'text/plain';
    res.writeHead(200, { 'Content-Type': t }); res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Local: http://localhost:${PORT}/  (catálogo)`);
  console.log(`       http://localhost:${PORT}/admin  (senha: ${process.env.ADMIN_PASSWORD || 'prohunters2026'})`);
});
