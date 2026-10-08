import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4'};
http.createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://127.0.0.1');
    const requested = decodeURIComponent(url.pathname);
    const allowed = requested==='/' || ['/index.html','/styles.css','/app.js'].includes(requested) || /^\/(assets|data)\//.test(requested);
    if(!allowed || requested.split('/').includes('..')) {res.writeHead(404);res.end('Not found');return;}
    const file = path.resolve(root, '.'+(requested==='/'?'/index.html':requested));
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const stat = await fs.stat(file);if(!stat.isFile())throw new Error('Not a file');
    const body = await fs.readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});
    res.end(req.method==='HEAD'?undefined:body);
  } catch {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`个人 AI 成果展示页：http://127.0.0.1:${port}`)).on('error',e=>{console.error(`预览启动失败：${e.code}。可以设置 PORT 选择其他端口。`);process.exitCode=1;});
