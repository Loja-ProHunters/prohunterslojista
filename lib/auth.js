/* auth: sessão stateless por cookie assinado (funciona em serverless) */
const crypto = require('crypto');

const PASSWORD = process.env.ADMIN_PASSWORD || 'prohunters2026';
const SECRET   = process.env.SESSION_SECRET || PASSWORD;

function sign(){ return crypto.createHmac('sha256', SECRET).update('ph-admin-v1').digest('hex'); }
function parseCookies(header){
  return Object.fromEntries((header||'').split(';').map(c => c.trim().split('=')).filter(a => a[0]));
}
function isAuthed(cookies){ return !!(cookies && cookies.ph_session && cookies.ph_session === sign()); }
function loginCookie(){ return `ph_session=${sign()}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`; }
function logoutCookie(){ return `ph_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`; }

module.exports = { PASSWORD, sign, parseCookies, isAuthed, loginCookie, logoutCookie };
