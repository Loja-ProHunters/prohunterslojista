/* handlers: lógica de negócio agnóstica de framework.
   Recebe um contexto {route, method, cookies, jsonBody, rawBody, contentType, params, query}
   e devolve {status, json, setCookie?}. Usada tanto pelas funções da Vercel quanto pelo server local. */
const store = require('./store');
const auth = require('./auth');
const { normalize, withCom, parseCSV } = require('./util');

async function handle(ctx){
  const { route, method, cookies, jsonBody, rawBody, contentType, params = {}, query = {} } = ctx;
  const authed = auth.isAuthed(cookies);

  if (route === 'login' && method === 'POST'){
    if ((jsonBody || {}).senha === auth.PASSWORD)
      return { status:200, setCookie: auth.loginCookie(), json:{ ok:true } };
    return { status:401, json:{ ok:false, erro:'Senha incorreta' } };
  }
  if (route === 'logout') return { status:200, setCookie: auth.logoutCookie(), json:{ ok:true } };
  if (route === 'me')     return { status:200, json:{ authed } };

  if (route === 'products' && method === 'GET'){
    const list = await store.getProducts();
    if (query.public === '1') return { status:200, json: list.filter(p => p.parc).map(withCom) };
    if (!authed) return { status:401, json:{ erro:'Não autenticado' } };
    return { status:200, json: list.map(withCom) };
  }

  // daqui pra baixo exige login
  if (!authed) return { status:401, json:{ erro:'Não autenticado' } };

  if (route === 'products' && method === 'POST'){
    const list = await store.getProducts();
    const np = normalize(jsonBody || {});
    if (!np.nome) return { status:400, json:{ erro:'Nome obrigatório' } };
    if (list.some(x => x.sku === np.sku)) return { status:409, json:{ erro:'SKU já existe' } };
    list.push(np); await store.setProducts(list);
    return { status:201, json: withCom(np) };
  }

  if (route === 'product' && method === 'PUT'){
    const list = await store.getProducts();
    const i = list.findIndex(x => x.sku === params.sku);
    if (i < 0) return { status:404, json:{ erro:'Produto não encontrado' } };
    const up = normalize({ ...list[i], ...(jsonBody || {}) });
    if (up.sku !== params.sku && list.some(x => x.sku === up.sku)) return { status:409, json:{ erro:'SKU já existe' } };
    list[i] = up; await store.setProducts(list);
    return { status:200, json: withCom(up) };
  }

  if (route === 'product' && method === 'DELETE'){
    const list = await store.getProducts();
    const next = list.filter(x => x.sku !== params.sku);
    if (next.length === list.length) return { status:404, json:{ erro:'Produto não encontrado' } };
    await store.setProducts(next);
    return { status:200, json:{ ok:true } };
  }

  if (route === 'import' && method === 'POST'){
    let incoming = [];
    if ((contentType || '').includes('application/json')){
      const arr = jsonBody; incoming = (Array.isArray(arr) ? arr : (arr && arr.items) || []).map(normalize);
    } else {
      incoming = parseCSV(rawBody || '');
    }
    const list = await store.getProducts();
    let novos = 0, atualizados = 0;
    for (const np of incoming){
      const i = list.findIndex(x => x.sku === np.sku);
      if (i >= 0){ list[i] = { ...list[i], ...np }; atualizados++; }
      else { list.push(np); novos++; }
    }
    await store.setProducts(list);
    return { status:200, json:{ ok:true, novos, atualizados, total:list.length } };
  }

  return { status:404, json:{ erro:'Rota não encontrada' } };
}

module.exports = { handle };
