import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve('../交付/版本/1.0.6-复活选关/web-mobile');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm','.css':'text/css','.wav':'audio/wav'};
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');if(url.pathname==='/favicon.ico'){res.writeHead(204);return res.end();}
 const file=path.resolve(root,decodeURIComponent(url.pathname.slice(1)||'index.html'));
 if(!file.startsWith(root+path.sep)||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(readFileSync(file));
});
server.listen(4196,'127.0.0.1',()=>console.log(`Frozen 1.0.6 preview http://127.0.0.1:4196 (pid ${process.pid})`));
