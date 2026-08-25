/* adaptador: transforma (req,res) da Vercel no contexto dos handlers */
const { parseCookies } = require('./auth');

async function rawBodyOf(req){
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  return await new Promise(resolve => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d)); req.on('error', () => resolve(''));
  });
}
async function makeCtx(req, route, params){
  const contentType = req.headers['content-type'] || '';
  const rawBody = await rawBodyOf(req);
  let jsonBody = null;
  if (contentType.includes('json')){
    if (req.body && typeof req.body === 'object') jsonBody = req.body;
    else { try { jsonBody = rawBody ? JSON.parse(rawBody) : {}; } catch { jsonBody = {}; } }
  } else if (req.body && typeof req.body === 'object') jsonBody = req.body;
  const query = req.query || Object.fromEntries(new URL(req.url, 'http://x').searchParams);
  return { route, method:req.method, cookies:parseCookies(req.headers.cookie), jsonBody, rawBody, contentType, params:params||{}, query };
}
function send(res, out){
  if (out.setCookie) res.setHeader('Set-Cookie', out.setCookie);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = out.status;
  res.end(JSON.stringify(out.json));
}
module.exports = { makeCtx, send };
