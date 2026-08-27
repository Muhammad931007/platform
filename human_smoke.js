const { chromium } = require('playwright');

async function textSample(page) {
  return (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim().slice(0, 500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const result = { client: {}, admin: {}, screenshots: [] };
  const client = await context.newPage();
  await client.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await client.waitForTimeout(1200);
  result.client.home = { title: await client.title(), text: await textSample(client), visible: await client.locator('body').isVisible() };
  await client.screenshot({ path: 'client_human_home.png', fullPage: true }); result.screenshots.push('client_human_home.png');
  const loginLink = client.getByText(/登录|Login/i).first();
  if (await loginLink.count()) { await loginLink.click().catch(() => {}); await client.waitForTimeout(500); }
  result.client.loginView = { url: client.url(), text: await textSample(client) };
  const inputs = client.locator('input');
  result.client.inputCount = await inputs.count();
  if (await inputs.count() >= 2) {
    await inputs.nth(0).fill('testuser');
    await inputs.nth(1).fill('password123');
    const submit = client.getByText('Sign In', { exact: true }).nth(1);
    if (await submit.count()) { await submit.click(); await client.waitForTimeout(1200); }
    result.client.afterLogin = { url: client.url(), text: await textSample(client) };
    await client.screenshot({ path: 'client_human_after_login.png', fullPage: true }); result.screenshots.push('client_human_after_login.png');
  }
  const admin = await context.newPage();
  await admin.goto('http://127.0.0.1:8080/admin.html#/admin/users/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await admin.waitForTimeout(1800);
  result.admin.loginOrUsers = { title: await admin.title(), url: admin.url(), text: await textSample(admin), visible: await admin.locator('body').isVisible() };
  await admin.screenshot({ path: 'admin_human_users.png', fullPage: true }); result.screenshots.push('admin_human_users.png');
  const controls = await admin.locator('button, a, input[type=button], input[type=submit]').count();
  result.admin.controlCount = controls;
  result.admin.memberWords = {};
  for (const word of ['会员列表','会员信息','邀请码','手机','用户名','邮箱','钱包','登录历史','禁止提现']) {
    result.admin.memberWords[word] = (await admin.getByText(word, { exact: false }).count()) > 0;
  }
  const basic = admin.getByText('基础资料', { exact: true }).first();
  if (await basic.count()) { await basic.click(); await admin.waitForTimeout(500); }
  result.admin.basicModal = { text: await textSample(admin), dialogs: await admin.locator('[role=dialog], .el-dialog, .layui-layer').count() };
  await browser.close();
  console.log(JSON.stringify(result));
})().catch(err => { console.error(err.stack || err); process.exit(1); });
