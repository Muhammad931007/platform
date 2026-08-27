const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { handleApiRequest, readDb, writeDb } = require('./api_handler');

const PORT = 8080;
const PUBLIC_DIR = path.resolve(__dirname);
const LOCAL_ADMIN_USERNAME = process.env.LOCAL_ADMIN_USERNAME || 'admin';
// A portable bundle must be runnable by double-clicking its launcher; retain
// the documented local credential when no environment variable is supplied.
const LOCAL_ADMIN_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || 'erpkl123123';
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

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function localLoginPage() {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>管理员登录</title><style>
  *{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Arial,"Microsoft YaHei",sans-serif;background:linear-gradient(135deg,#eef4ff,#f7f9fc);color:#1f2937}.card{width:390px;padding:36px;border-radius:14px;background:#fff;box-shadow:0 14px 45px #1d4ed81f}.brand{font-size:24px;font-weight:700;text-align:center;margin-bottom:8px}.sub{text-align:center;color:#6b7280;margin-bottom:28px}.field{margin:14px 0}label{display:block;font-size:13px;color:#4b5563;margin-bottom:7px}input{width:100%;height:42px;border:1px solid #d1d5db;border-radius:7px;padding:0 12px;font-size:15px}button{width:100%;height:44px;margin-top:12px;border:0;border-radius:7px;background:#2563eb;color:#fff;font-size:16px;cursor:pointer}button:hover{background:#1d4ed8}.captcha{height:42px;vertical-align:middle;margin-left:8px;cursor:pointer;border-radius:5px}.hint{text-align:center;color:#9ca3af;font-size:12px;margin-top:18px}.error{min-height:18px;color:#dc2626;font-size:13px;margin-top:10px;text-align:center}</style></head><body><main class="card"><div class="brand">后台管理系统</div><div class="sub">管理员登录</div><form id="login-form"><div class="field"><label for="username">用户名</label><input id="username" name="username" autocomplete="username" required></div><div class="field"><label for="password">密码</label><input id="password" name="password" type="password" autocomplete="current-password" required></div><div class="field"><label for="verify">验证码</label><div style="display:flex;align-items:center"><input id="verify" name="verify" value="GZPG" maxlength="8"><img class="captcha" src="/admin/login/captcha.svg" alt="验证码 GZPG" title="点击刷新"></div></div><input type="hidden" name="skey" value="${escapeHtml(LOCAL_ADMIN_SKEY)}"><div id="error" class="error"></div><button type="submit">登录</button></form><div class="hint">本地环境 · UTF-8</div></main><script>
  document.getElementById('login-form').addEventListener('submit',async function(e){e.preventDefault();const error=document.getElementById('error');error.textContent='';const body=new URLSearchParams(new FormData(this));const response=await fetch('/admin/login/index.html',{method:'POST',body,credentials:'same-origin'});const data=await response.json();if(data.code===1){location.href=data.url||'/admin.html';}else{error.textContent=data.msg||'登录失败';}});
  </script></body></html>`;
}

function localCaptchaSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="42" viewBox="0 0 112 42"><rect width="112" height="42" rx="5" fill="#eef2ff"/><path d="M4 30L106 10M6 8l96 25" stroke="#c7d2fe"/><text x="56" y="29" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" letter-spacing="5" fill="#3730a3">GZPG</text></svg>`;
}

function localMemberRow(user) {
  const id = escapeHtml(user.id || 1);
  const username = escapeHtml(user.username || 'testuser');
  const invite = escapeHtml(user.invitecode || '--');
  const phone = escapeHtml(user.tel || '--');
  const email = escapeHtml(user.email || '--');
  const balance = escapeHtml(Number(user.balance || 0).toFixed(2));
  const status = Number(user.status) === 0 ? '冻结' : '正常';
  const action = (label, url, kind = 'modal') => { const color = /禁用|禁止提现|重置佣金|配置奖励金|改单数/.test(label) ? 'layui-btn-danger' : /钱包|重置任务|普通方式|账变信息|连单列表/.test(label) ? 'layui-btn-normal' : /登录历史/.test(label) ? 'layui-btn-primary' : ''; return `<a href="javascript:void(0)" data-modal="${url}" data-title="${label}" class="layui-btn layui-btn-sm ${color} local-action">${label}</a>`; };
  return `<tr class="local-fixture-row"><td>${id}</td><td><div>ID: ${id}<br>邀请码: ${invite}<br>手机: ${phone}<br>用户名: <strong>${username}</strong><br>邮箱: ${email}</div></td><td>上级: --<br>上级邀请码: --</td><td>会员等级: VIP1<br>注册时间: 本地测试<br>注册IP: 127.0.0.1<br>注册位置: Local<br>信誉分: 100<br>最后上线IP: 127.0.0.1<br>最后上线位置: Local<br>最后上线时间: 刚刚</td><td>已完成: 0<br>总任务量: 0<br>已接单: 0<br>已重置: 0<br>已签到: 否</td><td>总资产: ${balance}<br>资产加利润: ${balance}<br>余额: ${balance}<br>充值: 0.00<br>提现: 0.00<br>收益: 0.00<br>连单金额: 0.00</td><td>在线<br>会员状态: ${status}<br>冻结: 否<br>普通账号<br>历史订单完成量: 0</td><td>${action('基础资料','/admin/users/edit_users.html?id='+id)} ${action('加扣款','/admin/users/adjust.html?id='+id)} ${action('钱包','/admin/users/edit_users_bk.html?uid='+id)} ${action('重置任务','/admin/users/reset_deal_cnt.html?id='+id,'open')} ${action('重置佣金','/admin/users/reset_deal_reward.html?id='+id,'open')} ${action('添加连单','/admin/plots/add.html?uid='+id,'open')} ${action('普通方式','/admin/plots/add_old.html?uid='+id,'open')} ${action('账变信息','/admin/users/caiwu.html?id='+id,'open')} ${action('连单列表','/admin/plots/liandan_list.html?uid='+id,'open')} ${action('改单数','/admin/users/set_deal_cnt.html?id='+id)} ${action('查看团队','/admin/users/myteams.html?uid='+id,'open')} ${action('登录历史','/admin/users/login_history.html?uid='+id,'open')} ${action('禁用','/admin/users/edit_users_status/2/'+id+'.html','open')} ${action('禁止提现','/admin/users/edit_withdral_message.html?id='+id)} ${action('发送通知','/admin/users/send_notice.html?id='+id,'open')} ${action('配置奖励金','/admin/users/set_reward_bonus.html?id='+id)}</td></tr>`;
}

function localMemberPage(db, query) {
  const filePath = path.join(PUBLIC_DIR, 'admin', 'users', 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');
  // The captured table has seven columns; remove any legacy leading ID cell
  // from older generated rows so the fixture aligns with its header.
  const rows = (db.users || []).map(localMemberRow).join('').replace(/(<tr class="local-fixture-row">)<td>[^<]*<\/td>/g, '$1').replace(/<tr class="local-fixture-row">/g, '<tr class="uid-1 local-fixture-row">').replace(/<td>/g, "<td class='text-left nowrap'>");
  html = html.replace(/<head([^>]*)>/i, `<head$1><style>.local-fixture-row{background:#fff!important}.local-fixture-row>td{vertical-align:top!important;padding:9px 15px!important;line-height:1.75;white-space:normal;color:#666;border:1px solid #e6e6e6}.local-fixture-row>td:first-child{border-left:1px solid #e6e6e6!important;padding-left:15px!important}.local-fixture-row>td:last-child{padding:9px 15px!important}.local-fixture-row>td:last-child .local-action{display:inline-block!important;vertical-align:top!important;width:calc(20% - 5px)!important;min-width:0!important;box-sizing:border-box!important;text-align:center!important;margin:5px 4px 0 0!important;line-height:28px!important;padding:0 4px!important;border-radius:2px!important;white-space:nowrap!important}</style>`);
  html = html.replace(/<tbody>/i, `<tbody>${rows}`);
  const page = Math.max(1, Number(query && query.get('page')) || 1);
  html = html.replace(/当前显示第\s*1\s*页/g, `当前显示第 ${page} 页`);
  html = html.replace(/第\s*1\s*页/g, `第 ${page} 页`);
  if (!/<head[^>]*>/i.test(html)) {
    html = `<style>.local-fixture-row>td{vertical-align:top;padding:9px 15px;line-height:1.75;color:#666;border:1px solid #e6e6e6}.local-fixture-row .local-action{display:inline-block;margin:5px 4px 0 0;padding:5px 10px;background:#009688;color:#fff;text-decoration:none;border-radius:2px}.local-fixture-row .local-action.layui-btn-normal{background:#1e9fff}.local-fixture-row .local-action.layui-btn-danger{background:#ff5722}.local-fixture-row .local-action.layui-btn-primary{background:#fff;color:#555;border:1px solid #ddd}</style>${html}<script>(function(){document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-modal]');if(!a)return;e.preventDefault();var o=document.createElement('div');o.style='position:fixed;inset:0;z-index:99999;background:#0008;display:flex;align-items:center;justify-content:center';o.innerHTML='<div style="background:#fff;width:min(820px,92vw);height:min(620px,88vh);overflow:auto;padding:28px;position:relative"><button style="position:absolute;right:12px;top:8px;font-size:24px;border:0;background:none" onclick="this.parentElement.parentElement.remove()">×</button><div>加载中…</div></div>';document.body.appendChild(o);fetch(a.getAttribute('data-modal'),{credentials:'same-origin'}).then(function(r){return r.text()}).then(function(t){o.lastChild.lastChild.innerHTML=t});});})();</script>`;
  }
  html = html.replace('</style>', '.local-fixture-row>td:last-child{width:400px!important;min-width:400px!important;max-width:400px!important;white-space:normal!important}.local-fixture-row>td:last-child .local-action{display:inline-block!important;vertical-align:top!important;width:calc(20% - 5px)!important;box-sizing:border-box!important;text-align:center!important;margin:5px 4px 0 0!important;white-space:nowrap!important}</style>');
  return html;
}

function localDataPanel(pathname, db) {
  const user = (db.users || [])[0] || {};
  const order = (db.orders || [])[0] || {};
  const recharge = (db.recharges || [])[0] || {};
  const withdraw = (db.withdraws || [])[0] || {};
  const esc = escapeHtml;
  let title = '', body = '';
  if (/order_list/.test(pathname)) { title = '本地订单测试数据'; body = `订单号：${esc(order.id || 'ORD-LOCAL-001')}　会员：${esc(order.username || user.username)}　商品：${esc(order.goods_name || 'ERP 测试商品')}　金额：${esc(order.goods_price || '450.00')}　佣金：${esc(order.commission || '22.50')}　状态：已完成`; }
  else if (/goods_list/.test(pathname)) { title = '本地产品 / applications 测试数据'; body = `商品名称：${esc(order.goods_name || 'ERP 测试商品')}　价格：${esc(order.goods_price || '450.00')}　佣金：${esc(order.commission || '22.50')}　库存：不限　状态：上架`; }
  else if (/deposit_list/.test(pathname)) { title = '本地资金 / 提现测试数据'; body = `提现单号：${esc(withdraw.id || 'WTH-LOCAL-001')}　会员：${esc(withdraw.username || user.username)}　金额：${esc(withdraw.amount || '200.00')}　地址：${esc(withdraw.address || '本地测试地址')}　状态：待审核`; }
  else if (/acclog|adjustlog/.test(pathname)) { title = '本地资金流水测试数据'; body = `会员：${esc(user.username || 'testuser')}　余额：${esc(user.balance || '2500.00')}　充值记录：${esc(recharge.amount || '500.00')}　提现记录：${esc(withdraw.amount || '200.00')}　可通过操作按钮调整`; }
  else if (/level/.test(pathname)) { title = '本地会员等级测试数据'; body = (db.vipList || []).map(v => `VIP${esc(v.id)}：门槛 ${esc(v.min_balance)}　佣金 ${esc(v.rate)}　每日任务 ${esc(v.order_num)}`).join('<br>'); }
  else if (/plots\/index|deal_console/.test(pathname)) { title = '本地联单任务测试数据'; body = `任务编号：PLOT-LOCAL-001　商品：${esc(order.goods_name || 'ERP 测试商品')}　金额：${esc(order.goods_price || '450.00')}　佣金：${esc(order.commission || '22.50')}　状态：可接单`; }
  else if (/auth\/index|user\/index/.test(pathname)) { title = '本地权限 / 系统用户测试数据'; body = '管理员：admin　角色：超级管理员　权限：会员、资金、订单、产品、配置　状态：启用'; }
  else if (/config\/info|menu\/index/.test(pathname)) { title = '本地系统配置测试数据'; body = `站点名称：${esc(db.config?.site_name || 'erpresearch')}　公告：${esc(db.config?.notice || '本地测试公告')}　环境：portable`; }
  else if (/oplog\/index|checkin\//.test(pathname)) { title = '本地日志 / 签到测试数据'; body = `会员：${esc(user.username || 'testuser')}　操作：本地测试　时间：刚刚　结果：成功`; }
  else return '';
  return `<div class="local-fixture-panel" style="margin:12px 0;padding:14px 18px;border:1px solid #dbeafe;border-left:4px solid #2563eb;background:#eff6ff;color:#1e3a8a;line-height:2"><strong>${title}</strong><br>${body}<br><span style="color:#64748b;font-size:12px">本地 fixture 数据，仅用于端到端测试；下方原页面按钮仍可正常使用。</span></div>`;
}

function isLoginPagePath(pathname) {
  return pathname === '/admin/login/index.html' || pathname === '/admin/login/index.htm' || pathname === '/admin/login.html';
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
        const ids = valueList(body, query);
        const targets = (db.users || []).filter(user => ids.includes(String(user.id)));
        let changed = 0;
        for (const user of targets) {
          for (const field of ['username', 'tel', 'email', 'invitecode', 'balance', 'credit']) {
            if (body[field] !== undefined && body[field] !== '') { user[field] = body[field]; changed++; }
          }
          if (body.amount !== undefined && body.amount !== '') {
            const amount = Number(body.amount) || 0;
            user.balance = (Number(user.balance || 0) + amount).toFixed(2); changed++;
          }
        }
        const recordId = String(body.id || query.get('id') || '');
        const records = [...(db.orders || []), ...(db.recharges || []), ...(db.withdraws || [])];
        const record = records.find(item => String(item.id) === recordId);
        if (record) {
          if (body.product || body.goods_name) { record.goods_name = body.product || body.goods_name; changed++; }
          if (body.price || body.goods_price) { record.goods_price = body.price || body.goods_price; changed++; }
          if (body.commission !== undefined && body.commission !== '') { record.commission = body.commission; changed++; }
          if (body.address) { record.address = body.address; changed++; }
          if (body.status !== undefined && body.status !== '') { record.status = Number(body.status); changed++; }
        }
        if (/config\/|menu\//.test(pathname) && (body.site_name || body.notice)) {
          db.config = db.config || {};
          if (body.site_name) db.config.site_name = body.site_name;
          if (body.notice) db.config.notice = body.notice;
          changed++;
        }
        if (changed) writeDb(db);
        return sendJson(res, { code: 1, msg: 'Action completed in the local replica', data: { changed, ids } });
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
    const id = escapeHtml(query.get('id') || query.get('uid') || '');
    const isOperational = /edit_users|adjust|add_money|wallet|edit_users_bk|set_deal_cnt|reward_bonus|deal|goods|plots|account|config|auth|menu|checkin|user/i.test(pathname);
    const fields = isOperational ? `<div class="layui-form-item"><label class="layui-form-label">用户名 / 名称</label><div class="layui-input-block"><input class="layui-input" name="username" placeholder="用户名或名称"><input class="layui-input" name="product" placeholder="商品名称" style="margin-top:8px"></div></div><div class="layui-form-item"><label class="layui-form-label">金额 / 价格</label><div class="layui-input-block"><input class="layui-input" name="amount" type="number" step="0.01" placeholder="金额，可正可负"><input class="layui-input" name="price" type="number" step="0.01" placeholder="商品价格" style="margin-top:8px"><input class="layui-input" name="commission" type="number" step="0.01" placeholder="佣金" style="margin-top:8px"></div></div><div class="layui-form-item"><label class="layui-form-label">地址</label><div class="layui-input-block"><input class="layui-input" name="address" placeholder="钱包 / 提现地址"></div></div><div class="layui-form-item"><label class="layui-form-label">状态</label><div class="layui-input-block"><select class="layui-input" name="status"><option value="1">启用 / 通过 / 完成</option><option value="0">停用 / 待审核 / 待处理</option></select></div></div><div class="layui-form-item"><label class="layui-form-label">备注</label><div class="layui-input-block"><input class="layui-input" name="remark" placeholder="填写操作说明"></div></div>` : `<div class="layui-form-item"><label class="layui-form-label">备注</label><div class="layui-input-block"><input class="layui-input" name="remark" placeholder="填写备注"></div></div>`;
    let specificFields = fields;
    if (/reset_deal_cnt|reset_deal_reward/.test(pathname)) specificFields = '<p>确认对该会员执行任务量或佣金重置？此操作仅影响本地数据。</p>';
    else if (/login_history|myteams|caiwu|deal_list/.test(pathname)) specificFields = '<p>这是只读查询窗口。选择筛选条件后点击查询。</p><div class="layui-form-item"><label class="layui-form-label">筛选</label><div class="layui-input-block"><input class="layui-input" name="filter" placeholder="输入关键词"></div></div>';
    else if (/send_notice|notice/.test(pathname)) specificFields = '<div class="layui-form-item"><label class="layui-form-label">通知标题</label><div class="layui-input-block"><input class="layui-input" name="notice_title" required></div></div><div class="layui-form-item"><label class="layui-form-label">通知内容</label><div class="layui-input-block"><textarea class="layui-textarea" name="notice" required></textarea></div></div>';
    else if (/reward_bonus/.test(pathname)) specificFields = '<div class="layui-form-item"><label class="layui-form-label">奖励金额</label><div class="layui-input-block"><input class="layui-input" name="amount" type="number" step="0.01" required></div></div><div class="layui-form-item"><label class="layui-form-label">触发次数</label><div class="layui-input-block"><input class="layui-input" name="trigger_count" type="number" min="1" value="1"></div></div>';
    else if (/edit_users_bk|withdraw/.test(pathname)) specificFields = '<div class="layui-form-item"><label class="layui-form-label">钱包地址</label><div class="layui-input-block"><input class="layui-input" name="address" required></div></div><div class="layui-form-item"><label class="layui-form-label">网络</label><div class="layui-input-block"><select class="layui-input" name="network"><option>TRC20</option><option>ERC20</option></select></div></div>';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title><link rel="stylesheet" href="/static/plugs/layui/css/layui.css"></head><body class="layui-padding-3"><div class="layui-card"><div class="layui-card-header">${safeTitle}</div><div class="layui-card-body"><form class="layui-form" method="post" action="${pathname}"><input type="hidden" name="id" value="${id}">${specificFields}<div class="layui-form-item"><div class="layui-input-block"><button class="layui-btn" type="submit">保存</button></div></div></form></div></div></body></html>`);
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

    // Serve a small, guaranteed UTF-8 login document locally. The captured
    // production page contains legacy/double-encoded text which can render as
    // question marks on some machines.
    if (isLoginPagePath(pathname) && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(localLoginPage());
    }
    if (pathname === '/admin/login/captcha.svg' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(localCaptchaSvg());
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

    // Put the bundled local fixture at the top of the member table so every
    // member action can be exercised from a fresh portable install.
    if (pathname === '/admin/users/index.html' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(localMemberPage(db, parsedUrl.searchParams));
    }

    const panel = pathname.startsWith('/admin/') && req.method === 'GET' ? localDataPanel(pathname, db) : '';
    if (panel) {
      const sourcePath = path.join(PUBLIC_DIR, pathname);
      if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isFile()) {
        let html = fs.readFileSync(sourcePath, 'utf8');
        if (/<body[^>]*>/i.test(html)) html = html.replace(/<body([^>]*)>/i, `<body$1>${panel}`);
        else html = panel + html;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(html);
      }
    }

    // 4. Default Static / Template Routing
    if (pathname === '/' || pathname === '/index.html') pathname = '/admin.html';
    if (pathname === '/admin/login.html' || pathname === '/admin/login/index') pathname = '/admin/login/index.html';

    let filePath = path.join(PUBLIC_DIR, pathname);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      if (pathname === '/admin.html') {
        let html = fs.readFileSync(filePath, 'utf8');
        html = html.replace('data-load="/admin/login/out.html"', 'href="/admin/login/out.html" data-load="/admin/login/out.html"');
        html = html.replace('</body>', `<style>#local-modal-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}#local-modal-overlay .local-modal-box{width:min(820px,92vw);height:min(620px,88vh);background:#fff;border-radius:6px;box-shadow:0 12px 40px #0006;overflow:auto;position:relative;padding:0 18px 18px}#local-modal-overlay .local-modal-close{position:absolute;right:14px;top:8px;border:0;background:none;font-size:26px;cursor:pointer;color:#666}#local-modal-overlay .local-modal-content{padding-top:34px}</style><script>(function(){document.addEventListener('click',function(e){var el=e.target.closest&&e.target.closest('[data-modal]');if(el){e.preventDefault();var old=document.getElementById('local-modal-overlay');if(old)old.remove();var o=document.createElement('div');o.id='local-modal-overlay';o.innerHTML='<div class="local-modal-box"><button class="local-modal-close" aria-label="关闭">×</button><div class="local-modal-content">加载中…</div></div>';document.body.appendChild(o);o.querySelector('.local-modal-close').onclick=function(){o.remove()};fetch(el.getAttribute('data-modal'),{credentials:'same-origin'}).then(function(r){return r.text()}).then(function(t){o.querySelector('.local-modal-content').innerHTML=t}).catch(function(){o.querySelector('.local-modal-content').textContent='加载失败，请重试'});}});})();</script></body>`);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      }
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
