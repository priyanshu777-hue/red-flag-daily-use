const http = require('http');
const fs = require('fs');
http.createServer((req, res) => {
  const page = req.url.split('?')[0].replace(/\/$/, '') === '/bella' ? 'bella.html' : 'index.html';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(page).pipe(res);
}).listen(3000, () => console.log('Listening on 3000'));
