const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const adminRoutes = [
  '/admin/index/main.html', '/admin/users/index.html', '/admin/users/cs_list.html',
  '/admin/users/level.html', '/admin/users/login_history.html', '/admin/user/index.html',
  '/admin/auth/index.html', '/admin/menu/index.html', '/admin/oplog/index.html',
  '/admin/account/acclog.html', '/admin/account/adjustlog.html',
  '/admin/deal/order_list.html', '/admin/deal/deal_console.html',
  '/admin/deal/deposit_list.html', '/admin/deal/deposit_list_test.html',
  '/admin/deal/goods_list.html', '/admin/checkin/member_checkin_log.html',
  '/admin/config/info.html', '/admin/plots/index.html', '/admin/help/active.html',
  '/admin/help/agreement.html', '/admin/help/banner.html',
  '/admin/help/helplottery.html', '/admin/help/infomation.html',
  '/admin/help/jianjie.html', '/admin/help/notice.html', '/admin/help/pdgz.html'
];

const outDir = path.join(__dirname, 'visual_audit_screenshots');
fs.mkdirSync(outDir, { recursive: true });

async function visible(page) {
  return (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://erpresearch-admincsx.merkleon.com/admin.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  const loginInputs = page.locator('input');
  await loginInputs.nth(0).fill('admin');
  await loginInputs.nth(1).fill('erpkl123123');
  await loginInputs.nth(1).press('Enter');
  await page.waitForTimeout(2600);
  const admin = [];
  for (const route of adminRoutes) {
    await page.goto('https://erpresearch-admincsx.merkleon.com/admin.html#' + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(650);
    const text = await visible(page);
    const file = route.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') + '.png';
    await page.screenshot({ path: path.join(outDir, 'live_' + file), fullPage: true });
    admin.push({ route, controls: await page.locator('button,a,input,select,textarea,[data-action],[data-modal],[data-open]').count(), visibleChars: text.length, text: text.slice(0, 400), screenshot: 'visual_audit_screenshots/live_' + file });
  }

  const client = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await client.goto('https://www.erpresearchprime.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await client.waitForTimeout(1800);
  const clientText = await visible(client);
  await client.screenshot({ path: path.join(outDir, 'live_client_home.png'), fullPage: true });
  const result = { generatedAt: new Date().toISOString(), liveAdminUrl: page.url(), admin, client: { controls: await client.locator('a,button,input,[class*=btn],[class*=tab],[class*=menu]').count(), visibleChars: clientText.length, text: clientText.slice(0, 800), screenshot: 'visual_audit_screenshots/live_client_home.png' } };
  fs.writeFileSync(path.join(__dirname, 'visual_audit_results.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ adminPages: admin.length, pagesWithVisibleText: admin.filter(x => x.visibleChars > 40).length, totalControls: admin.reduce((n, x) => n + x.controls, 0), clientControls: result.client.controls, clientVisibleChars: result.client.visibleChars, results: 'visual_audit_results.json' }));
  await browser.close();
})().catch(error => { console.error(error.stack || error); process.exit(1); });
