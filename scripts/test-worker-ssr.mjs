import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Miniflare } = require('miniflare');
function moduleFiles(dir) {
  return readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory() ? moduleFiles(path.join(dir,e.name)) : /\.js$/.test(e.name) ? [path.join(dir,e.name)] : []);
}
const modules = moduleFiles('dist/server').sort((a,b) => (a==='dist/server/index.js' ? -1 : b==='dist/server/index.js' ? 1 : a.localeCompare(b))).map(file=>({type:'ESModule',path:path.resolve(file)}));
const worker = new Miniflare({
  modules,
  modulesRoot: path.resolve('dist/server'),
  compatibilityDate: '2026-05-15',
  compatibilityFlags: ['nodejs_compat'],
  d1Databases: ['DB'],
  r2Buckets: ['BUCKET'],
});
try {
  const db = await worker.getD1Database('DB');
  for (const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()) {
    for (const sql of readFileSync('drizzle/'+f,'utf8').split('--> statement-breakpoint').filter(s=>s.trim())) await db.prepare(sql).run();
  }
  const start=performance.now();
  const response=await worker.dispatchFetch('https://mixlocadora.com.br/');
  const html=await response.text();
  console.log(JSON.stringify({status:response.status,bytes:html.length,ms:Math.round(performance.now()-start),h1:html.match(/<h1[^>]*>[\s\S]*?<\/h1>/)?.[0]}));
  assert.equal(response.status,200,html.slice(0,200));
  assert.match(html,/ALUGUEL DE MOTOS/);
  assert.match(html,/Honda CG 160/);
  assert.doesNotMatch(html, /ADMIN_PASSWORD_HASH|SESSION_SECRET|admin_credentials/);
  for (const [path, contentType] of [['/robots.txt','text/plain'],['/sitemap.xml','application/xml']]) {
    const r=await worker.dispatchFetch('https://mixlocadora.com.br'+path);
    assert.equal(r.status,200);assert.match(r.headers.get('content-type'),new RegExp(contentType));
  }
  await db.prepare("UPDATE site_settings SET whatsapp_number=?, address=?, hours=? WHERE id='main'").bind('5548999999999','Rua Teste, 100 - Centro, Palhoça - SC, 88130-000','Segunda a sexta · 8h às 18h').run();
  const refreshed=await worker.dispatchFetch('https://mixlocadora.com.br/');
  const refreshedHtml=await refreshed.text();
  assert.match(refreshedHtml,/Rua Teste/);
  assert.match(refreshedHtml,/tel:\+5548999999999/);
  assert.match(refreshedHtml,/mix.public-catalog/);
  assert.match(refreshedHtml,/application\/ld\+json/);
  assert.doesNotMatch(refreshedHtml,/<[^>]+\son[a-z]+\s*=/i);
  const canonical=await worker.dispatchFetch('https://www.mixlocadora.com.br/',{redirect:'manual'});
  assert.equal(canonical.status,301);assert.equal(canonical.headers.get('location'),'https://mixlocadora.com.br/');
  const missing=await worker.dispatchFetch('https://mixlocadora.com.br/nao-existe');
  assert.equal(missing.status,404);
  const admin=await worker.dispatchFetch('https://mixlocadora.com.br/admin/dashboard',{redirect:'manual'});
  assert.equal(admin.status,303);
  console.log('Worker SSR, crawl files and administrative boundary passed.');
} finally { await worker.dispose(); }
