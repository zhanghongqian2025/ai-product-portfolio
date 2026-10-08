import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 12);
const content = await fs.readFile(path.join(root, 'data/portfolio.json'), 'utf8');
const contentFile = `data/portfolio-${digest(content)}.json`;
const source = await fs.readFile(path.join(root, 'app.js'), 'utf8');
if (!source.includes("fetch('data/portfolio.json')")) throw new Error('Content loader not found');
const runtime = source.replace("fetch('data/portfolio.json')", `fetch('${contentFile}')`);
const runtimeFile = `app-${digest(runtime)}.js`;
const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
await fs.writeFile(path.join(root, contentFile), content);
await fs.writeFile(path.join(root, runtimeFile), runtime);
await fs.writeFile(path.join(root, 'index.html'), html.replace(/src="app(?:-[a-f0-9]+)?\.js"/, `src="${runtimeFile}"`));
console.log(`发布文件已生成：${runtimeFile}，${contentFile}`);
