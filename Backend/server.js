const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { handleApiRequest, readDb, writeDb } = require('./api_handler');

const PORT = 8080;
const PUBLIC_DIR = path.resolve(__dirname);
const LOCAL_ADMIN_USERNAME = process.env.LOCAL_ADMIN_USERNAME || 'admin';
const LOCAL_ADMIN_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || '';
const adminSessions = new Set();
const LOCAL_ADMIN_SKEY = (() => {
  try {
    const loginHtml = fs.readFileSync(path.join(__dirname, 'admin', 'login', 'index.html'), 'utf8');
    return (loginHtml.match(/name=["']skey["'][^>]*value=["']([^"']+)/i) || [])[1] || '';
  } catch (_) { return ''; }
})();

function cookieValue(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  const entry = cookies.map(item => item.trim()).find(item => item.startsWith(name + '='));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : '';
}

function isAdminAuthenticated(req) {
  const token = cookieValue(req, 'local_admin_session');
  return Boolean(token && adminSessions.has(token));
}

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function valueList(body, query) {
  const raw = body.id || body.uid || body.user_id || query.get('id') || query.get('uid') || '';
  return String(raw).split(',').map(value => value.trim()).filter(Boolean);
}

function handleAdminAction(req, res, pathname, query, body, db, hasStaticFile) {
  const actionRoutes = new Set([
    '/admin/deal/deposit_success.html', '/admin/deal/deposit_fail.html',
    '/admin/deal/do_deposit2.html', '/admin/deal/do_deposit3.html',
    '/admin/deal/del_goods.html', '/admin/config/clear.html',
    '/admin/users/delete_user.html', '/admin/users/edit_users_status',
    '/admin/users/reset_deal_cnt.html', '/admin/users/reset_deal_reward.html',
    '/admin/users/revert_reset_deal_cnt.html', '/admin/users/grant_reward_bonus.html',
    '/admin/users/confirm_reward_bonus.html', '/admin/users/cancel_reward_bonus.html',
    '/admin/users/delete_login_history.html', '/admin/users/remove_cs.html',
    '/admin/users/level_forbid.html', '/admin/users/level_resume.html',
    '/admin/users/show_gift_modal.html',
    '/admin/auth/forbid.html', '/admin/auth/remove.html',
    '/admin/user/forbid.html', '/admin/user/remove.html',
    '/admin/menu/forbid.html', '/admin/menu/resume.html', '/admin/menu/remove.html',
    '/admin/oplog/remove.html', '/admin/plots/cancel.html'
  ]);
  const isUserStatus = pathname.startsWith('/admin/users/edit_users_status/');
  const isCsStatus = pathname.startsWith('/admin/users/edit_cs_status/');
  const isKnownAction = actionRoutes.has(pathname) || isUserStatus || isCsStatus;

  if (hasStaticFile && !isKnownAction) return false;

  if (req.method !== 'GET') {
    if (!isKnownAction) {
      if (pathname.startsWith('/admin/') && !hasStaticFile) {
        return sendJson(res, { code: 1, msg: 'Form submitted in the local replica', data: { changed: 0 } });
      }
      return sendJson(res, { code: 404, msg: `Unsupported local admin action: ${pathname}` }, 404);
    }
    const ids = valueList(body, query);
    let changed = 0;

    if (pathname === '/admin/deal/deposit_success.html' || pathname === '/admin/deal/deposit_fail.html' || pathname === '/admin/deal/do_deposit2.html' || pathname === '/admin/deal/do_deposit3.html') {
      const approved = pathname === '/admin/deal/deposit_success.html' || pathname === '/admin/deal/do_deposit2.html';
      for (const record of db.recharges || []) {
        if (!ids.length || ids.includes(String(record.id))) {
          record.status = approved ? 1 : 3;
          changed++;
        }
      }
    } else if (pathname === '/admin/users/delete_user.html') {
      const before = db.users.length;
      db.users = db.users.filter(user => !ids.includes(String(user.id)));
      changed = before - db.users.length;
    } else if (pathname === '/admin/users/edit_users_status' || isUserStatus) {
      const status = body.status || pathname.split('/').slice(-2, -1)[0] || '2';
      for (const user of db.users) if (ids.includes(String(user.id))) { user.status = String(status); changed++; }
    } else if (pathname.includes('reset_deal_cnt')) {
      for (const user of db.users) if (ids.includes(String(user.id))) { user.today_order_count = 0; changed++; }
    } else if (pathname.includes('reset_deal_reward') || pathname.includes('revert_reset_deal_cnt')) {
      for (const user of db.users) if (ids.includes(String(user.id))) { user.today_income = '0.00'; changed++; }
    }

    if (changed > 0) writeDb(db);
    return sendJson(res, { code: 1, msg: 'Action completed in the local replica', data: { changed, ids } });
  }

  // Modal links referenced by captured pages are rendered as local forms when
  // their original server template was not part of the browser snapshot.
  if (pathname.startsWith('/admin/') && pathname.endsWith('.html')) {
    const title = pathname.split('/').pop().replace(/\.html$/i, '').replace(/[-_]/g, ' ');
    const safeTitle = title.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><link rel="stylesheet" href="/static/plugs/layui/css/layui.css"></head><body class="layui-padding-3"><div class="layui-card"><div class="layui-card-header">${safeTitle}</div><div class="layui-card-body"><form method="post" action="${pathname}"><p class="color-desc">Local replica form. Submit to apply this action to local fixture data.</p><input type="hidden" name="id" value="${query.get('id') || ''}"><button class="layui-btn" type="submit">Save locally</button></form></div></div></body></html>`);
  }
  return false;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, token, Authorization, lang');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  let bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', () => {
    let bodyData = {};
    if (bodyChunks.length > 0) {
      const rawBody = Buffer.concat(bodyChunks).toString('utf8');
      try {
        bodyData = JSON.parse(rawBody);
      } catch (e) {
        const params = new URLSearchParams(rawBody);
        bodyData = Object.fromEntries(params.entries());
      }
    }

    const db = readDb();

    // 1. Order Info Polling for Backend Navbar Audio & Badge
    if (pathname === '/admin/index/order_info.html') {
      const pendingRecharge = db.recharges.filter(r => r.status === 0).length;
      const todayOrders = db.orders.length;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        code: 1,
        deposit: pendingRecharge,
        order: todayOrders,
        deposit_test: 0
      }));
    }

    // 2. Admin Login Action
    if (pathname === '/admin/login/index.html' && req.method === 'POST') {
      // admin.js removes skey from the submitted form after hashing. Recover the
      // page's hidden key so the captured visual login form can be verified.
      const loginSkey = bodyData.skey || LOCAL_ADMIN_SKEY;
      const expectedHash = loginSkey ? md5(md5(LOCAL_ADMIN_PASSWORD) + loginSkey) : '';
      const passwordMatches = bodyData.password === LOCAL_ADMIN_PASSWORD || (expectedHash && bodyData.password === expectedHash);
      if (!LOCAL_ADMIN_PASSWORD || bodyData.username !== LOCAL_ADMIN_USERNAME || !passwordMatches) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          code: 0,
          msg: 'Invalid administrator credentials. Set LOCAL_ADMIN_PASSWORD before starting the local server.'
        }));
      }
      const session = crypto.randomBytes(24).toString('hex');
      adminSessions.add(session);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `local_admin_session=${encodeURIComponent(session)}; Path=/; HttpOnly; SameSite=Lax`
      });
      return res.end(JSON.stringify({
        code: 1,
        msg: '登录成功，正在进入系统...',
        url: '/admin.html#/admin/index/main.html?spm=m-1'
      }));
    }

    // The captured shell uses a GET action for logout. Clear the local session
    // and send the browser back to the real login page.
    if (pathname === '/admin/login/out.html') {
      const session = cookieValue(req, 'local_admin_session');
      if (session) adminSessions.delete(session);
      res.writeHead(302, {
        Location: '/admin/login/index.html',
        'Set-Cookie': 'local_admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
      });
      return res.end();
    }

    // Do not expose the admin shell or its data pages without a local session.
    // Static assets remain public so the login page can render its visual form.
    const isLoginPage = pathname === '/admin/login/index.html' || pathname === '/admin/login/index.htm' || pathname === '/admin/login.html';
    const isAdminPage = pathname === '/admin.html' || pathname.startsWith('/admin/');
    if (isAdminPage && !isLoginPage && !isAdminAuthenticated(req)) {
      res.writeHead(302, { Location: '/admin/login/index.html' });
      return res.end();
    }

    // 3. API Routing (shared with Client)
    if (pathname.startsWith('/myapi')) {
      const queryData = Object.fromEntries(parsedUrl.searchParams.entries());
      return handleApiRequest(req, res, pathname, { ...queryData, ...bodyData });
    }

    // Captured admin pages use POST action endpoints for buttons and GET modal
    // endpoints for forms. Keep those behaviors local and deterministic.
    const adminFilePath = path.join(PUBLIC_DIR, pathname);
    const hasStaticAdminFile = pathname.startsWith('/admin/') && fs.existsSync(adminFilePath) && fs.statSync(adminFilePath).isFile();
    const adminActionResult = handleAdminAction(req, res, pathname, parsedUrl.searchParams, bodyData, db, hasStaticAdminFile);
    if (adminActionResult !== false) return adminActionResult;

    // 4. Default Static / Template Routing
    if (pathname === '/' || pathname === '/index.html') pathname = '/admin.html';
    if (pathname === '/admin/login.html' || pathname === '/admin/login/index') pathname = '/admin/login/index.html';

    let filePath = path.join(PUBLIC_DIR, pathname);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      if (fs.existsSync(filePath + '.html') && fs.statSync(filePath + '.html').isFile()) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return fs.createReadStream(filePath + '.html').pipe(res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Backend Admin & Central DB Server running at:`);
  console.log(` Dashboard:  http://localhost:${PORT}/admin.html#/admin/index/main.html?spm=m-1`);
  console.log(` Login Page: http://localhost:${PORT}/admin/login/index.html`);
  if (!LOCAL_ADMIN_PASSWORD) console.log(' Admin login is disabled until LOCAL_ADMIN_PASSWORD is set.');
  console.log(`====================================================`);
});
