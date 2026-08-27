const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApiRequest } = require('./api_handler');

const PORT = 3000;
const PUBLIC_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
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
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, token, Authorization, lang');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Parse Body for POST / PUT
  let bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', () => {
    let bodyData = {};
    if (bodyChunks.length > 0) {
      const rawBody = Buffer.concat(bodyChunks).toString('utf8');
      try {
        bodyData = JSON.parse(rawBody);
      } catch (e) {
        // Parse urlencoded
        const params = new URLSearchParams(rawBody);
        bodyData = Object.fromEntries(params.entries());
      }
    }

    // Route /myapi requests
    if (pathname.startsWith('/myapi')) {
      const queryData = Object.fromEntries(parsedUrl.searchParams.entries());
      // The shipped client follows the production convention code:0 = success,
      // while the admin/local action API uses code:1. Keep that contract at the
      // transport boundary without forking the shared business handler.
      req.__clientApi = true;
      return handleApiRequest(req, res, pathname, { ...queryData, ...bodyData });
    }

    // Static files
    if (pathname === '/') pathname = '/index.html';
    let filePath = path.join(PUBLIC_DIR, pathname);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // SPA fallback
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Client Application & API Server running at:`);
  console.log(` http://localhost:${PORT}`);
  console.log(`====================================================`);
});
