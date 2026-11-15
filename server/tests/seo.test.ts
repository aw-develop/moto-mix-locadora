import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSitemap } from '../seo/sitemap.ts';
import { publicPage } from '../seo/public-page.ts';
import { localBusiness, serializeStructuredData } from '../seo/structured-data.ts';
import { environment, request, seedState } from './helpers.ts';
import { handleApi } from '../router.ts';
const origin='https://mixlocadora.com.br';
const realSettings={...seedState().settings,whatsappNumber:'5548999999999',address:'Rua Exemplo, 100 - Centro, Palhoça - SC, 88130-000',hours:'Segunda a sexta · 8h às 18h\nSábado · 8h às 12h',instagram:'https://www.instagram.com/exemplo'};

test('public SSR receives only public D1 content and never cookies, drafts or administrative history',async()=>{
 const {env,db}=environment();
 try {
  const state={...seedState(),settings:realSettings};
  state.activities=[{id:'secret-event',type:'settings',title:'PRIVATE_HISTORY',detail:'INTERNAL_DETAIL',at:new Date().toISOString()}];
  state.banners=[...state.banners,{...state.banners[0]!,id:'draft',title:'PRIVATE_DRAFT',active:false}];
  assert.equal((await handleApi(request('PUT',{version:0,state}),env))?.status,200);
  const render=async(req:Request,context:{publicCatalog: unknown})=>{
   assert.equal(req.headers.get('cookie'),null);
   assert.equal(req.headers.get('authorization'),null);
   assert.doesNotMatch(JSON.stringify(context),/PRIVATE_HISTORY|INTERNAL_DETAIL|PRIVATE_DRAFT|ADMIN_PASSWORD_HASH/);
   return new Response('<html><head></head><body><h1>Aluguel de motos em Palhoça</h1></body></html>',{headers:{'set-cookie':'unwanted=test'}});
  };
  const r=await publicPage(new Request(origin+'/',{headers:{cookie:'private-session',authorization:'Bearer untrusted'}}),env,render);
  assert.equal(r?.status,200);assert.equal(r.headers.get('set-cookie'),null);
  const html=await r.text();assert.match(html,/application\/ld\+json/);assert.match(html,/Rua Exemplo/);
  assert.doesNotMatch(html,/PRIVATE_HISTORY|PRIVATE_DRAFT/);
 }finally{db.close();}
});
test('canonical redirects do not render or touch D1; robots/sitemap have proper bodies and admin stays separate',async()=>{
 const {env,db}=environment();
 const renderer=async()=>{throw Error('Must not render');};
 try {
  for(const host of ['www.mixlocadora.com.br','mix-locadora-angular.operacional-825.workers.dev','mix-locadora-motos-racing.alesonroberto3.chatgpt.site']){
   const r=await publicPage(new Request(`https://${host}/?utm_source=test`),env,renderer);
   assert.equal(r?.status,301);assert.equal(r.headers.get('location'),origin+'/?utm_source=test');
  }
  for(const [path,type] of [['/robots.txt','text/plain'],['/sitemap.xml','application/xml']] as const){
   const r=await publicPage(new Request(origin+path),env,renderer);assert.equal(r?.status,200);assert.match(r.headers.get('content-type')!,new RegExp(type));
   const text=await r.text();assert.doesNotMatch(text,/<html|mix-app/);
   if(path==='/sitemap.xml'){assert.match(text,/<loc>https:\/\/mixlocadora.com.br\/<\/loc>/);assert.doesNotMatch(text,/admin|workers\.dev|#motos/);}
  }
  assert.equal(await publicPage(new Request(origin+'/admin/dashboard'),env,renderer),null);
  assert.equal(await publicPage(new Request(origin+'/api/state'),env,renderer),null);
  const missing=await publicPage(new Request(origin+'/pagina-inexistente'),env,renderer);assert.equal(missing?.status,404);
  const head=await publicPage(new Request(origin+'/sitemap.xml',{method:'HEAD'}),env,renderer);assert.equal(await head?.text(),'');
 }finally{db.close();}
});
test('SSR failures return retryable 503 instead of indexing a loading screen',async()=>{
 const {env,db}=environment();
 try{
  const r=await publicPage(new Request(origin+'/'),env,async()=>{throw Error('internal renderer failure');});
  assert.equal(r?.status,503);assert.equal(r.headers.get('x-robots-tag'),'noindex');assert.equal(r.headers.get('retry-after'),'60');
  assert.doesNotMatch(await r.text(),/internal renderer failure|Carregando Mix|mix-app/);
 }finally{db.close();}
});
test('structured data uses real settings, validates hours, omits invented ratings and escapes script delimiters',()=>{
 const business=localBusiness(realSettings)!;
 assert.equal(business['telephone'],'+5548999999999');
 const address=business['address'] as Record<string,unknown>;assert.equal(address['addressLocality'],'Palhoça');assert.equal(address['postalCode'],'88130-000');
 const hours=business['openingHoursSpecification'] as Record<string,unknown>[];assert.equal(hours.length,2);assert.equal(hours[0]!['opens'],'08:00');assert.equal(hours[1]!['closes'],'12:00');
 assert.equal(business['aggregateRating'],undefined);
 assert.equal(localBusiness(seedState().settings),null);
 assert.equal(localBusiness({...realSettings,hours:'Horários a confirmar'})?.['openingHoursSpecification'],undefined);
 const serialized=serializeStructuredData({value:'</script><script>alert(1)</script>&'});
 assert.doesNotMatch(serialized,/<script|<\/script|&/);assert.equal(JSON.parse(serialized).value,'</script><script>alert(1)</script>&');
});


test('sitemap lists only the canonical page and public first-party images with XML escaping',()=>{
 const state={...seedState()};
 const image='/api/media/moto.webp?color=green&size=large';
 state.bikes=[{...state.bikes[0]!,image},{...state.bikes[0]!,id:'duplicate',image}];
 state.banners=[
  {...state.banners[0]!,image:'/assets/banner.webp',active:true},
  {...state.banners[0]!,id:'draft',image:'/assets/private-draft.webp',active:false},
  {...state.banners[0]!,id:'external',image:'https://other.example/photo.webp',active:true},
  {...state.banners[0]!,id:'inline',image:'data:image/png;base64,AAAA',active:true},
  {...state.banners[0]!,id:'api',image:'/api/state',active:true},
 ];
 const xml=buildSitemap(state);
 assert.match(xml,/xmlns:image="http:\/\/www.google.com\/schemas\/sitemap-image\/1.1"/);
 assert.equal((xml.match(/<url>/g)||[]).length,1);
 assert.equal((xml.match(/<image:image>/g)||[]).length,2);
 assert.match(xml,/color=green&amp;size=large/);
 assert.doesNotMatch(xml,/private-draft|other.example|data:image|api\/state|<lastmod>|<priority>|<changefreq>/);
});

test('sitemap reflects saved catalog changes and remains independent of Angular rendering',async()=>{
 const {env,db}=environment();
 try {
  const state={...seedState()};
  state.bikes=state.bikes.map(bike=>({...bike,image:'/assets/current-bike.webp'}));
  assert.equal((await handleApi(request('PUT',{version:0,state}),env))?.status,200);
  const response=await publicPage(new Request(origin+'/sitemap.xml'),env,async()=>{throw Error('No Angular rendering needed');});
  assert.equal(response?.status,200);
  assert.equal(response.headers.get('x-robots-tag'),null);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.match(await response.text(),/https:\/\/mixlocadora.com.br\/assets\/current-bike.webp/);
 } finally {db.close();}
});
