/* store: usa Vercel KV (Upstash) quando disponível; senão, arquivo local (dev). */
const fs = require('fs');
const path = require('path');

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const FILE = path.join(__dirname, '..', 'data', 'products.json');
const SEED = require('../data/products.json');

async function kvGet(){
  const r = await fetch(`${KV_URL}/get/products`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const j = await r.json();
  return j && j.result ? JSON.parse(j.result) : null;
}
async function kvSet(list){
  await fetch(`${KV_URL}/set/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(list)
  });
}

async function getProducts(){
  if (KV_URL){
    const v = await kvGet();
    if (v == null){ await kvSet(SEED); return SEED.slice(); }
    return v;
  }
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return SEED.slice(); }
}
async function setProducts(list){
  if (KV_URL){ await kvSet(list); return; }
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

module.exports = { getProducts, setProducts, hasKV: !!KV_URL };
