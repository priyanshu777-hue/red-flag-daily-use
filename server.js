const http = require('http');
const fs = require('fs');
const path = require('path');
const TYPES = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url.startsWith('/bella-assets/')) {
    const file = path.join(__dirname, 'bella-assets', path.basename(url));
    return fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' });
      res.end(data);
    });
  }
  const page = url.replace(/\/$/, '') === '/bella' ? 'bella.html' : 'index.html';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(page).pipe(res);
}).listen(3000, () => console.log('Listening on 3000'));
