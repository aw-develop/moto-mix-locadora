import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
const issues=[];
const secretPatterns=[
 ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
 ['GitHub token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
 ['OpenAI key',/\bsk-(?:proj-|svcacct-)[A-Za-z0-9_-]{24,}\b/],
 ['AWS access key',/\bAKIA[A-Z0-9]{16}\b/],
 ['password hash',/\b[a-f0-9]{48,64}:[a-f0-9]{64}\b/],
];
function inspect(name,bytes,browser=false){
 if(bytes.includes(0))return;
 const text=bytes.toString('utf8');
 for(const [label,pattern] of secretPatterns)if(pattern.test(text))issues.push(`${name}: possible ${label}`);
 if(browser){
  if(/\.(?:map|sql|tsx?|mjs|cjs|env)$/.test(name)||/(?:^|\/)(?:\.git|\.env|server|db|drizzle|node_modules)(?:\/|$)/.test(name))issues.push(`${name}: private artifact in browser output`);
  if(/\b(?:ADMIN_PASSWORD_HASH|ADMIN_EMAILS|ADMIN_USERNAME|admin_credentials|admin_sessions|login_attempts|PBKDF2)\b/.test(text))issues.push(`${name}: server-only authentication identifier in browser output`);
  if(name.endsWith('.html') && /<[^>]+\son[a-z]+\s*=/i.test(text))issues.push(`${name}: inline event handler incompatible with strict script CSP`);
 }
}
const tracked=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
for(const file of tracked){
 if(/(?:^|\/)\.env(?!\.example$)|(?:^|\/)\.dev\.vars/.test(file))issues.push(`${file}: sensitive environment file tracked`);
 if(existsSync(file))inspect(file,readFileSync(file));
}
let browserFiles=0;
function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else{browserFiles++;inspect(file,readFileSync(file),true);}}}
for(const dir of ['public/client','dist/client'])if(existsSync(dir))walk(dir);
if(!browserFiles)issues.push('Build the application before checking the browser output.');
let historicalBlobs=0;
if(process.argv.includes('--history')){
 const objects=execFileSync('git',['rev-list','--objects','--all'],{maxBuffer:32*1024*1024}).toString().trim().split('\n');
 for(const line of objects){
  const [sha,...parts]=line.split(' ');const name=parts.join(' ');if(!name)continue;
  const type=execFileSync('git',['cat-file','-t',sha]).toString().trim();if(type!=='blob')continue;
  historicalBlobs++;inspect(`history:${name}`,execFileSync('git',['cat-file','blob',sha],{maxBuffer:32*1024*1024}));
 }
}
if(issues.length){console.error(JSON.stringify({ok:false,issues:[...new Set(issues)]},null,2));process.exit(1);}
console.log(JSON.stringify({ok:true,sourceFiles:tracked.length,browserFiles,historicalBlobs,note:'Pattern-based check; not a guarantee that every secret or vulnerability is detected.'}));
