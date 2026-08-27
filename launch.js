const { spawn } = require('child_process');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const localNode = path.join(__dirname, 'system', 'nodejs', 'node.exe');
const nodeCommand = fs.existsSync(localNode) ? localNode : 'node';

async function main() {
  console.log('====================================================');
  console.log(' Starting Client & Backend Servers...');
  console.log('====================================================');

  const clientProc = spawn(nodeCommand, ['server.js'], {
    cwd: path.join(__dirname, 'Client'),
    stdio: 'inherit' 
  });
  
  const backendProc = spawn(nodeCommand, ['server.js'], {
    cwd: path.join(__dirname, 'Backend'),
    stdio: 'inherit' 
  });

  // Wait for servers to be ready
  await new Promise(r => setTimeout(r, 2000));

  console.log('\nLaunching Visible Chromium Browser...');
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: null });

  // Tab 1: Client
  const clientPage = await context.newPage();
  console.log('Opening Tab 1: Client Frontend (http://localhost:3000)');
  await clientPage.goto('http://localhost:3000');

  // Tab 2: Backend Admin
  const backendPage = await context.newPage();
  console.log('Opening Tab 2: Backend Admin (http://localhost:8080/admin.html)');
  await backendPage.goto('http://localhost:8080/admin.html#/admin/index/main.html?spm=m-1');

  console.log('\nBoth systems are running and open in Chromium!');
  console.log('Press Ctrl + C in this terminal when you want to stop the servers.');

  // Keep process alive while browser is open
  browser.on('disconnected', () => {
    console.log('Browser closed. Stopping servers...');
    clientProc.kill();
    backendProc.kill();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Launch Error:', err);
});
