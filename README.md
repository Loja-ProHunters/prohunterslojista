# Pro Hunters — Programa de Parceiros (GitHub + Vercel)

Catálogo white-label + painel de produtos, prontos para publicar na **Vercel** (serverless).
Sem dependências externas — só Node.

- `/` — catálogo público (o lojista mostra ao cliente).
- `/admin` — painel para cadastrar/editar produtos (senha).
- `/api/*` — funções serverless (login, produtos, import).

## Estrutura
```
api/          → funções serverless da Vercel
  login.js  logout.js  me.js  products.js  products/[sku].js  import.js
lib/          → lógica compartilhada (handlers, store, auth, util)
data/         → products.json (semente inicial / fallback de leitura)
admin.html    → painel de produtos
catalogo.html → catálogo público
server.js     → servidor LOCAL de desenvolvimento (não usado na Vercel)
vercel.json   → rotas amigáveis (/ e /admin)
```

## Publicar (passo a passo)

### 1. Subir no GitHub
Crie um repositório e suba esta pasta (pelo site do GitHub ou por linha de comando):
```bash
git init && git add . && git commit -m "Programa de Parceiros"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/prohunters-parceiros.git
git push -u origin main
```

### 2. Importar na Vercel
1. Acesse vercel.com → **Add New… → Project** → importe o repositório do GitHub.
2. Framework Preset: **Other** (não precisa configurar build). Clique em **Deploy**.
3. Ao terminar, o catálogo já abre no endereço `*.vercel.app` (lendo a semente de `data/products.json`).

### 3. Ligar o banco (para as edições PERSISTIREM)
A Vercel é serverless e não grava em arquivo. Para salvar as edições, conecte um **Vercel KV** (gratuito):
1. No projeto, aba **Storage → Create Database → KV** (Upstash Redis) → **Connect** ao projeto.
   Isso adiciona sozinho as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
2. Em **Settings → Environment Variables**, adicione:
   - `ADMIN_PASSWORD` = a senha do painel (troque a padrão!).
   - (opcional) `SESSION_SECRET` = qualquer texto aleatório.
3. **Redeploy** (Deployments → ⋯ → Redeploy). Pronto — as edições agora persistem no KV.

> Sem o KV, o catálogo funciona (leitura da semente), mas salvar/editar dá erro — é só ligar o KV.

### 4. Acessar
- Catálogo: `https://SEU-PROJETO.vercel.app/`
- Admin: `https://SEU-PROJETO.vercel.app/admin` (senha do `ADMIN_PASSWORD`)

## Importar todo o catálogo do site (Tray)
No painel da Tray, exporte os produtos em **CSV**; no `/admin`, clique em **Importar CSV do site**
e selecione o arquivo. O sistema reconhece nome, preço, categoria, SKU e estoque, criando os novos
e atualizando os existentes (pelo SKU).

## Rodar localmente (opcional)
```bash
node server.js      # http://localhost:3000  (admin em /admin, senha padrão prohunters2026)
```
Localmente ele grava em `data/products.json` (não precisa de KV para testar).

## Comissão por categoria
Automática: Óptica 12%, Acessório 12%, Munição 6%, Arma 4%.

## Segurança (nota)
A autenticação é por senha compartilhada + cookie assinado, adequada para uso interno. A Vercel já
serve tudo em HTTPS. Para vários usuários no futuro, vale evoluir para contas individuais.
