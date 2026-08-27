const fs = require('fs');
const path = require('path');

// Keep all local state beside the server so the Visual folder can be moved as
// one unit without rewriting source files.
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const DB_BACKUP_PATH = path.join(__dirname, 'data', 'db.json.bak');

// Initialize Database if not exists
function initDb() {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const defaultData = {
      users: [
        {
          id: 1,
          username: "testuser",
          password: "password123",
          paypwd: "123456",
          tel: "+1234567890",
          invitecode: "ERP888",
          token: "mock_token_user_1",
          expiretime: 1999999999,
          balance: "2500.00",
          freeze_balance: "0.00",
          today_income: "125.40",
          total_income: "1580.00",
          vip_level: 1,
          credit: 100,
          gender: "Male",
          headimg: "/static/branding/erpresearch-logo-dark.png",
          usdt_address: "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE",
          usdt_type: "TRC20",
          created_at: new Date().toISOString()
        }
      ],
      orders: [
        {
          id: "ORD-20260826-001",
          user_id: 1,
          username: "testuser",
          goods_name: "SAP S/4HANA Cloud ERP Suite Enterprise License",
          goods_pic: "/static/qietu/image-1.png.webp",
          goods_price: "450.00",
          commission: "22.50",
          status: 1, // 1: completed, 0: pending
          created_at: new Date().toISOString()
        },
        {
          id: "ORD-20260826-002",
          user_id: 1,
          username: "testuser",
          goods_name: "Oracle NetSuite Cloud ERP Analytics & Optimization Module",
          goods_pic: "/static/qietu/image-1.png.webp",
          goods_price: "680.00",
          commission: "34.00",
          status: 1,
          created_at: new Date().toISOString()
        }
      ],
      recharges: [
        {
          id: "REC-20260826-001",
          user_id: 1,
          username: "testuser",
          amount: "500.00",
          currency: "USDT-TRC20",
          txid: "0x78a1bc945920ea13b190f84501239912da059b",
          status: 1, // 1: approved, 0: pending
          created_at: new Date().toISOString()
        }
      ],
      withdraws: [
        {
          id: "WTH-20260826-001",
          user_id: 1,
          username: "testuser",
          amount: "200.00",
          address: "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE",
          status: 0, // 0: pending, 1: approved
          created_at: new Date().toISOString()
        }
      ],
      config: {
        site_name: "erpresearch",
        notice: "Welcome to erpresearch independent ERP system! Please complete daily matching orders on time.",
        telegram: "https://t.me/erpresearch_support",
        whatsapp: "https://wa.me/1234567890",
        livechat: "https://erpresearchprime.com/support",
        usdt_trc20: "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE",
        usdt_erc20: "0x71C67Ed375375B3fF4A5E4459C3D129486c47864"
      },
      vipList: [
        { id: 1, name: "VIP 1", min_balance: "100.00", rate: "0.005", order_num: 30, desc: "30 orders per day, 0.5% commission" },
        { id: 2, name: "VIP 2", min_balance: "500.00", rate: "0.007", order_num: 40, desc: "40 orders per day, 0.7% commission" },
        { id: 3, name: "VIP 3", min_balance: "2000.00", rate: "0.009", order_num: 50, desc: "50 orders per day, 0.9% commission" },
        { id: 4, name: "VIP 4", min_balance: "5000.00", rate: "0.012", order_num: 60, desc: "60 orders per day, 1.2% commission" }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readDb() {
  initDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(data) {
  const serialized = JSON.stringify(data, null, 2) + '\n';
  const tempPath = DB_PATH + '.tmp';
  fs.writeFileSync(tempPath, serialized, 'utf8');
  if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, DB_BACKUP_PATH);
  fs.renameSync(tempPath, DB_PATH);
}

function ensureDbShape(db) {
  db.news = Array.isArray(db.news) ? db.news : [];
  db.help = Array.isArray(db.help) ? db.help : [];
  db.certificates = Array.isArray(db.certificates) ? db.certificates : [];
  db.checkins = Array.isArray(db.checkins) ? db.checkins : [];
  db.rewardClaims = Array.isArray(db.rewardClaims) ? db.rewardClaims : [];
  return db;
}

// Handler for all /myapi requests
async function handleApiRequest(req, res, pathname, bodyData) {
  // The compiled uni-app client wraps POST payloads in `data` and the login
  // screen uses phone/pwd names. Normalize both forms once at the boundary so
  // every client control and direct API caller reaches the same handler logic.
  if (bodyData && bodyData.data && typeof bodyData.data === 'object' && !Array.isArray(bodyData.data)) {
    bodyData = { ...bodyData, ...bodyData.data };
  }
  if (bodyData && bodyData.info && typeof bodyData.info === 'object' && !Array.isArray(bodyData.info)) {
    bodyData = { ...bodyData, ...bodyData.info };
  }
  const db = ensureDbShape(readDb());
  let subPath = pathname.replace(/^\/myapi/, '');
  if (!subPath.startsWith('/')) subPath = '/' + subPath;

  // Helper response functions
  const success = (data = {}, msg = 'Success') => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ code: req.__clientApi ? 0 : 1, msg, info: msg, data }));
  };

  const error = (msg = 'Error', code = 0) => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ code, msg, info: msg, data: null }));
  };

  const rawToken = req.headers['token'] || req.headers['authorization'] || (bodyData && bodyData.token);
  const token = typeof rawToken === 'string' ? rawToken.replace(/^Bearer\s+/i, '') : rawToken;
  const currentUser = db.users.find(u => u.token === token);

  // 1. Language list
  if (subPath === '/login/getlang') {
    return success({
      lang: [
        { lang: 'en', title: 'English' },
        { lang: 'zh-Hans', title: '简体中文' },
        { lang: 'ja', title: '日本語' },
        { lang: 'ko', title: '한국어' },
        { lang: 'es', title: 'Español' },
        { lang: 'de', title: 'Deutsch' }
      ]
    });
  }

  // 2. Login
  if (subPath === '/login/do_login_v1') {
    const { username, password, phone, pwd } = bodyData || {};
    const loginName = username || phone;
    const loginPassword = password || pwd;
    const user = db.users.find(u => (u.username === loginName || u.tel === loginName) && u.password === loginPassword);
    if (!user) {
      return error('Invalid username or password', 401);
    }
    return success({
      id: user.id,
      username: user.username,
      token: user.token,
      expiretime: user.expiretime,
      balance: user.balance,
      userinfo: user
    }, 'Login successful');
  }

  // 3. Register
  if (subPath === '/login/do_register') {
    const { username, password, paypwd, invitecode, tel } = bodyData || {};
    const existing = db.users.find(u => u.username === username);
    if (existing) return error('Username already registered');

    const newUser = {
      id: db.users.length + 1,
      username,
      password,
      paypwd: paypwd || '123456',
      tel: tel || '',
      invitecode: invitecode || 'ERP' + Math.floor(1000 + Math.random() * 9000),
      token: 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2),
      expiretime: Date.now() + 86400000 * 30,
      balance: '100.00', // Welcome bonus
      freeze_balance: '0.00',
      today_income: '0.00',
      total_income: '0.00',
      vip_level: 1,
      credit: 100,
      gender: 'Secret',
      headimg: '/static/branding/erpresearch-logo-dark.png',
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    writeDb(db);
    return success({
      id: newUser.id,
      username: newUser.username,
      token: newUser.token,
      userinfo: newUser
    }, 'Registration successful');
  }

  // Browser-visible public content. These are intentionally local fixtures; no
  // production account or transaction data is copied into the replica.
  if (subPath === '/index/getNewsList') return success({ list: db.news });
  if (subPath === '/index/getNewsDetail') {
    const item = db.news.find(n => String(n.id) === String(bodyData.id || bodyData.news_id));
    return item ? success(item) : error('News item not found', 404);
  }
  if (subPath === '/index/getHelpMsgDetail') {
    const item = db.help.find(h => String(h.id) === String(bodyData.id || bodyData.help_id));
    return item ? success(item) : error('Help item not found', 404);
  }
  if (subPath === '/index/getCertificate') return success({ list: db.certificates });
  if (subPath === '/login/getagree') return success({ content: '' });
  if (subPath === '/infomation/index') return success({ list: [], content: '' });
  if (subPath === '/file_upload/check') return success({ enabled: true, max_size: 5242880, extensions: ['jpg', 'jpeg', 'png', 'webp'], upload_url: '/myapi/file_upload' });
  if (subPath === '/login/getcode' || subPath === '/Send/sendsms') {
    return success({ sent: true, expires_in: 300 }, 'Verification code generated for local preview');
  }
  if (subPath === '/login/do_forget') return success({}, 'Password reset is not enabled in the local replica');
  if (subPath === '/login/google_login' || subPath === '/login/google_register') {
    return error('Third-party authentication is not configured locally', 501);
  }

  // Login and support screens request these public values before a token exists.
  // Keeping them public also prevents an in-flight pre-login 302 from clearing a
  // session that was just established by the user.
  if (subPath === '/Support/index' || subPath === '/user/getCustomerServiceTime') {
    return success({
      telegram: db.config.telegram,
      whatsapp: db.config.whatsapp,
      livechat: db.config.livechat,
      service_time: '24/7 Online'
    });
  }

  // The compiled client interceptor treats 302 as an expired session and
  // redirects to its login page. Preserve that contract for async requests.
  if (!currentUser) return error('Authentication required', 302);

  // 4. Index / Home Page
  if (subPath === '/index/index') {
    return success({
      banner: [
        { image: '/static/qietu/banner-1.webp' },
        { image: '/static/123/bg.webp' }
      ],
      notice: db.config.notice,
      userinfo: {
        username: currentUser.username,
        balance: currentUser.balance,
        freeze_balance: currentUser.freeze_balance,
        today_income: currentUser.today_income,
        total_income: currentUser.total_income,
        vip_level: currentUser.vip_level
      },
      ranking: [
        { username: 'alex***', amount: '$4,280.00' },
        { username: 'david***', amount: '$3,850.00' },
        { username: 'elena***', amount: '$3,120.00' }
      ]
    });
  }

  // 5. User Center & Profile
  if (subPath === '/My/index' || subPath === '/My/getMyInfo') {
    return success({
      userinfo: currentUser,
      ...currentUser
    });
  }

  // 6. VIP List
  if (subPath === '/My/vipList' || subPath === '/My/indexVipList') {
    return success({
      list: db.vipList,
      user_vip: currentUser.vip_level
    });
  }

  // 7. Order Matching & Tasks
  if (subPath === '/rotorder/index' || subPath === '/rotorder/startqd' || subPath === '/rotorder/startqd2') {
    const products = [
      { name: "SAP Business One ERP Cloud Deployment", price: "280.00", commission: "14.00", img: "/static/qietu/image-1.png.webp" },
      { name: "Oracle NetSuite Cloud ERP Financials Suite", price: "450.00", commission: "22.50", img: "/static/qietu/image-1.png.webp" },
      { name: "Microsoft Dynamics 365 Supply Chain Management", price: "620.00", commission: "31.00", img: "/static/qietu/image-1.png.webp" },
      { name: "Infor CloudSuite Industrial ERP Integration", price: "390.00", commission: "19.50", img: "/static/qietu/image-1.png.webp" }
    ];
    const p = products[Math.floor(Math.random() * products.length)];
    return success({
      order_id: 'ORD-' + Date.now(),
      goods_name: p.name,
      goods_pic: p.img,
      goods_price: p.price,
      commission: p.commission,
      user_balance: currentUser.balance,
      today_order_count: db.orders.filter(o => o.user_id === currentUser.id).length,
      max_order_count: 30
    });
  }

  // 8. Order Submission
  if (subPath === '/order/do_order') {
    const commission = parseFloat(bodyData.commission || 15.00);
    currentUser.balance = (parseFloat(currentUser.balance) + commission).toFixed(2);
    currentUser.today_income = (parseFloat(currentUser.today_income) + commission).toFixed(2);
    currentUser.total_income = (parseFloat(currentUser.total_income) + commission).toFixed(2);

    const newOrder = {
      id: bodyData.order_id || ('ORD-' + Date.now()),
      user_id: currentUser.id,
      username: currentUser.username,
      goods_name: bodyData.goods_name || 'SAP S/4HANA ERP License',
      goods_pic: bodyData.goods_pic || '/static/qietu/image-1.png.webp',
      goods_price: bodyData.goods_price || '300.00',
      commission: commission.toFixed(2),
      status: 1,
      created_at: new Date().toISOString()
    };
    db.orders.push(newOrder);
    writeDb(db);
    return success({ order: newOrder, new_balance: currentUser.balance }, 'Task completed successfully');
  }

  // 9. Order List
  if (subPath === '/order/order_list') {
    const userOrders = db.orders.filter(o => o.user_id === currentUser.id);
    return success({ list: userOrders });
  }

  // 10. Customer Support
  if (subPath === '/Support/index' || subPath === '/user/getCustomerServiceTime') {
    return success({
      telegram: db.config.telegram,
      whatsapp: db.config.whatsapp,
      livechat: db.config.livechat,
      service_time: '24/7 Online'
    });
  }

  // Presence heartbeat emitted immediately after a successful client login.
  if (subPath === '/user/online') {
    currentUser.online = String(bodyData.status || '1') === '1';
    currentUser.last_online_at = new Date().toISOString();
    writeDb(db);
    return success({ online: currentUser.online });
  }

  // 11. Deposit / Recharge Info
  if (subPath === '/ctrl/getUsdtInfo' || subPath === '/ctrl/recharge2') {
    return success({
      trc20_address: db.config.usdt_trc20,
      erc20_address: db.config.usdt_erc20,
      min_recharge: "10.00",
      exchange_rate: "1.00"
    });
  }

  // 12. Submit Recharge
  if (subPath === '/ctrl/recharge_do' || subPath === '/ctrl/do_deposit') {
    const amount = bodyData.amount || "100.00";
    const rec = {
      id: 'REC-' + Date.now(),
      user_id: currentUser.id,
      username: currentUser.username,
      amount: parseFloat(amount).toFixed(2),
      currency: bodyData.currency || 'USDT-TRC20',
      txid: bodyData.txid || '0x' + Math.random().toString(16).substring(2),
      status: 0, // Pending admin review
      created_at: new Date().toISOString()
    };
    db.recharges.push(rec);
    writeDb(db);
    return success({ record: rec }, 'Deposit request submitted. Pending confirmation.');
  }

  // 13. Withdraw submit
  if (subPath === '/ctrl/deposit' || subPath === '/ctrl/cash') {
    const amount = parseFloat(bodyData.amount || 0);
    if (amount > parseFloat(currentUser.balance)) {
      return error('Withdrawal amount exceeds available balance');
    }
    currentUser.balance = (parseFloat(currentUser.balance) - amount).toFixed(2);
    const wth = {
      id: 'WTH-' + Date.now(),
      user_id: currentUser.id,
      username: currentUser.username,
      amount: amount.toFixed(2),
      address: bodyData.address || currentUser.usdt_address,
      status: 0, // Pending admin review
      created_at: new Date().toISOString()
    };
    db.withdraws.push(wth);
    writeDb(db);
    return success({ record: wth, new_balance: currentUser.balance }, 'Withdrawal submitted successfully');
  }

  // 14. Logs
  if (subPath === '/My/acclog' || subPath === '/My/cashlog' || subPath === '/My/rechargelog') {
    return success({
      list: [
        ...db.recharges.filter(r => r.user_id === currentUser.id),
        ...db.withdraws.filter(w => w.user_id === currentUser.id)
      ]
    });
  }

  // 15. Invite
  if (subPath === '/My/invite') {
    return success({
      invite_code: currentUser.invitecode,
      invite_url: `http://localhost:3000/#/pages/login/register?invite_code=${currentUser.invitecode}`,
      team_count: 0
    });
  }

  // Profile and account settings.
  if (subPath === '/My/edit_realname') {
    currentUser.realname = String(bodyData.realname || bodyData.name || '').trim();
    writeDb(db);
    return success({ realname: currentUser.realname });
  }
  if (subPath === '/my/edit_gender') {
    currentUser.gender = String(bodyData.gender || 'Secret');
    writeDb(db);
    return success({ gender: currentUser.gender });
  }
  if (subPath === '/my/update_avatar' || subPath === '/My/do_setHeadImg') {
    currentUser.headimg = String(bodyData.headimg || bodyData.avatar || currentUser.headimg || '');
    writeDb(db);
    return success({ headimg: currentUser.headimg });
  }
  if (subPath === '/My/edit_address' || subPath === '/My/do_editaddress') {
    currentUser.address = String(bodyData.address || '');
    writeDb(db);
    return success({ address: currentUser.address });
  }
  if (subPath === '/My/bind_usdt' || subPath === '/My/do_bindusdt') {
    currentUser.usdt_address = String(bodyData.address || bodyData.usdt_address || '');
    currentUser.usdt_type = String(bodyData.type || bodyData.usdt_type || 'TRC20');
    writeDb(db);
    return success({ address: currentUser.usdt_address, type: currentUser.usdt_type });
  }
  if (subPath === '/My/bind_bank' || subPath === '/My/do_bindbank') {
    currentUser.bank = {
      bank_name: String(bodyData.bank_name || bodyData.bank || ''),
      account_name: String(bodyData.account_name || bodyData.name || ''),
      account_no: String(bodyData.account_no || bodyData.card_no || '')
    };
    writeDb(db);
    return success({ bank: currentUser.bank });
  }
  if (subPath === '/My/changePwd') {
    if (!bodyData.old_password || bodyData.old_password !== currentUser.password) return error('Current password is incorrect', 400);
    if (!bodyData.password) return error('New password is required', 400);
    currentUser.password = String(bodyData.password);
    writeDb(db);
    return success({}, 'Password changed');
  }
  if (subPath === '/My/changePayPwd') {
    if (!bodyData.paypwd && !bodyData.password) return error('Payment password is required', 400);
    currentUser.paypwd = String(bodyData.paypwd || bodyData.password);
    writeDb(db);
    return success({}, 'Payment password changed');
  }
  if (subPath === '/My/checkwalletpwd') return success({ valid: bodyData.paypwd === currentUser.paypwd });
  if (subPath === '/My/checkmywallet') return success({ balance: currentUser.balance, freeze_balance: currentUser.freeze_balance });
  if (subPath === '/My/myWallet') return success({ balance: currentUser.balance, freeze_balance: currentUser.freeze_balance, usdt_address: currentUser.usdt_address || '' });

  // Read-only local records and engagement state.
  if (subPath === '/My/myTeam' || subPath === '/My/myTeamYjLog') return success({ list: [], count: 0 });
  if (subPath === '/My/getVipInfo') return success({ vip_level: currentUser.vip_level, list: db.vipList });
  if (subPath === '/My/buyVip') return error('VIP purchases are unavailable in the local replica', 501);
  if (subPath === '/My/myCheckIn') return success({ checked_in: db.checkins.some(c => c.user_id === currentUser.id && c.date === new Date().toISOString().slice(0, 10)) });
  if (subPath === '/My/checkIn') {
    const date = new Date().toISOString().slice(0, 10);
    if (!db.checkins.some(c => c.user_id === currentUser.id && c.date === date)) {
      db.checkins.push({ user_id: currentUser.id, date, created_at: new Date().toISOString() });
      writeDb(db);
    }
    return success({ checked_in: true });
  }
  if (subPath === '/my/getRewardBonusStatus') return success({ claimed: db.rewardClaims.some(c => c.user_id === currentUser.id) });
  if (subPath === '/my/claimRewardBonus') {
    if (!db.rewardClaims.some(c => c.user_id === currentUser.id)) {
      db.rewardClaims.push({ user_id: currentUser.id, created_at: new Date().toISOString() });
      writeDb(db);
    }
    return success({ claimed: true });
  }

  // Orders, notices, and balance-product pages are deliberately read-only or
  // non-financial in this local fixture.
  if (subPath === '/order/order_info') {
    const order = db.orders.find(o => String(o.id) === String(bodyData.id || bodyData.order_id));
    return order ? success({ order }) : error('Order not found', 404);
  }
  if (subPath === '/order/rating_order') return success({}, 'Rating recorded locally');
  if (subPath === '/rotorder/stopqd') return success({ stopped: true });
  if (subPath === '/ctrl/recharge_before') return success({ enabled: false, message: 'Recharge is disabled in the local replica' });
  if (subPath === '/ctrl/lixibao' || subPath === '/ctrl/mylixibao') return success({ list: [], balance: '0.00' });
  if (subPath === '/ctrl/lixibao_recorde') return success({ list: [] });
  if (subPath === '/ctrl/lixibao_notice_one') return success({ content: '' });
  if (subPath === '/ctrl/lixibao_ru' || subPath === '/ctrl/lixibao_chu') return error('Balance-product transfers are unavailable locally', 501);
  if (subPath === '/Index/getNoticePopup') return success({ show: false, content: '' });
  if (subPath === '/index/getIndexLogList') return success({ list: [] });
  if (subPath === '/index/updateBadge') return success({ updated: true });

  // Unknown paths must not masquerade as successful API calls. This makes
  // missing parity visible during browser testing.
  return error(`Unsupported local endpoint: ${subPath}`, 404);
}

module.exports = {
  initDb,
  readDb,
  writeDb,
  handleApiRequest
};
