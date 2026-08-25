const { handle } = require('../../lib/handlers');
const { makeCtx, send } = require('../../lib/vercel');
// PUT (editar) e DELETE (remover) por SKU
module.exports = async (req, res) => send(res, await handle(await makeCtx(req, 'product', { sku: req.query.sku })));
