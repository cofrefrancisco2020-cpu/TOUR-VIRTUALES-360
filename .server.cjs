const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleR2Presign, handleR2Delete } = require('./r2-presign.cjs');
const root = process.cwd();
const envPath = path.join(root, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) return;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  });
}
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server = http.createServer((req,res)=>{
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/r2-presign') {
    handleR2Presign(req, res);
    return;
  }
  if (url.pathname === '/api/r2-delete') {
    handleR2Delete(req, res);
    return;
  }
  let filePath = path.join(root, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data)=>{
    if (err && url.pathname.startsWith('/tours/')) {
      fs.readFile(path.join(root, 'index.html'), (fallbackErr, fallbackData) => {
        if (fallbackErr) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, {'Content-Type': mime['.html']});
        res.end(fallbackData);
      });
      return;
    }
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream'});
    res.end(data);
  });
});
server.listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173'));
