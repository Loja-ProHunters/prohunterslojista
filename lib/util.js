/* util: categorias, normalização e parser de CSV */
const crypto = require('crypto');

const CAT_COM = { 'Óptica':0.12, 'Acessório':0.12, 'Munição':0.06, 'Arma':0.04 };
const VALID_CATS = Object.keys(CAT_COM);

function mapCat(raw){
  const s = (raw||'').toLowerCase();
  if (/arma|pistola|revolver|revólver|carabina|espingarda|rifle|fuzil/.test(s)) return 'Arma';
  if (/muni|cartucho|\bcbc\b|calibre|\bcal\b|espoleta|projétil|projetil/.test(s)) return 'Munição';
  if (/mira|luneta|red\s*dot|óptic|optic|scope|holosun|vector|binóc|binoc/.test(s)) return 'Óptica';
  return 'Acessório';
}
function catIcon(c){ return { 'Óptica':'🔭','Acessório':'🎒','Munição':'📦','Arma':'🔫' }[c] || '📦'; }

function toNumber(v){
  return Number(String(v ?? 0).replace(/[^\d.,-]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',', '.')) || 0;
}
function normalize(p){
  const cat = VALID_CATS.includes(p.cat) ? p.cat : mapCat(p.cat || p.categoria);
  return {
    sku: String(p.sku || p.codigo || ('SKU-'+crypto.randomBytes(3).toString('hex'))).trim(),
    nome: String(p.nome || p.name || '').trim(),
    cat,
    preco: toNumber(p.preco ?? p.price),
    estoque: parseInt(p.estoque ?? p.stock ?? 0) || 0,
    ic: p.ic || catIcon(cat),
    img: String(p.img || p.imagem || p.foto || p.image || '').trim(),
    desc: String(p.desc || p.descricao || '').trim(),
    ctrl: p.ctrl != null ? !!p.ctrl : (cat === 'Arma' || cat === 'Munição'),
    parc: p.parc != null ? !!p.parc : true
  };
}
function withCom(p){ return { ...p, comissao: CAT_COM[p.cat] }; }

function parseCSV(text){
  const lines = String(text||'').split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const delim = (lines[0].match(/;/g)||[]).length > (lines[0].match(/,/g)||[]).length ? ';' : ',';
  const split = line => {
    const out = []; let cur = '', q = false;
    for (const ch of line){
      if (ch === '"') q = !q;
      else if (ch === delim && !q){ out.push(cur); cur=''; }
      else cur += ch;
    }
    out.push(cur); return out.map(s => s.trim());
  };
  const headers = split(lines[0]).map(h => h.toLowerCase());
  const idx = names => headers.findIndex(h => names.some(n => h.includes(n)));
  const iN=idx(['nome','produto','name','título','titulo']), iP=idx(['preço','preco','price','valor']),
        iC=idx(['categoria','category','depart']), iS=idx(['sku','código','codigo','ref']),
        iE=idx(['estoque','stock','qtd','quant']), iD=idx(['descri','desc']),
        iIMG=idx(['imagem','foto','image','picture']);
  return lines.slice(1).map(l => {
    const c = split(l);
    return normalize({
      nome: iN>=0?c[iN]:'', preco: iP>=0?c[iP]:0, categoria: iC>=0?c[iC]:'',
      sku: iS>=0?c[iS]:'', estoque: iE>=0?c[iE]:0, descricao: iD>=0?c[iD]:'',
      imagem: iIMG>=0?c[iIMG]:''
    });
  }).filter(p => p.nome);
}

module.exports = { CAT_COM, VALID_CATS, normalize, withCom, parseCSV, mapCat };
