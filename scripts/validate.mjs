import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'data/portfolio.json'),'utf8'));
const ids=new Set(data.projects.map(p=>p.id));
if(ids.size!==data.projects.length)throw Error('Duplicate project ID');
for(const p of data.projects){
 for(const key of ['id','title','type','company','summary','problem','solution'])if(!p[key])throw Error('Missing '+p.id+'.'+key);
 for(const id of [p.parent,...(p.relatedIds||[])].filter(Boolean))if(!ids.has(id))throw Error('Unknown related project '+id);
 for(const m of p.media||[]){
  for(const view of [m,m.compact].filter(Boolean)){
   if(!/^assets\//.test(view.file)||view.file.includes('..'))throw Error('Invalid asset path');
   if(view.width!==undefined||view.height!==undefined){
    if(![view.width,view.height].every(n=>Number.isInteger(n)&&n>0))throw Error('Invalid screenshot dimensions: '+view.file);
   }
   await fs.access(path.join(root,view.file));
  }
 }
 for(const l of [...(p.links||[]),...(p.storeLinks||[]),...(p.agentExamples||[]),...(p.platformCollections||[])])if(l.url){if(new URL(l.url).protocol!=='https:')throw Error('Non-HTTPS product URL');}
}
console.log('内容与资源检查通过：'+data.companies.length+' 家公司、'+data.projects.length+' 项成果。');
