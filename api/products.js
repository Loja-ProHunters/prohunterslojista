const { handle } = require('../lib/handlers');
const { makeCtx, send } = require('../lib/vercel');
// GET (lista / catálogo público) e POST (criar)
module.exports = async (req, res) => send(res, await handle(await makeCtx(req, 'products')));
