const { handle } = require('../lib/handlers');
const { makeCtx, send } = require('../lib/vercel');
module.exports = async (req, res) => send(res, await handle(await makeCtx(req, 'me')));
