// copy-public-assets.js
// Vite build 完成后，将 public/ 下的 JSON 和 SVG 复制到 report/（构建输出目录）
// Cloudflare Pages 服务 report/ 目录，所有静态资源必须在这里
import { cp, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const reportDir = join(root, 'report');

async function copyExt(exts) {
  const files = await readdir(publicDir);
  for (const f of files) {
    if (!exts.some(e => f.endsWith(e))) continue;
    const src = join(publicDir, f);
    const dst = join(reportDir, f);
    const st = await stat(src);
    if (!st.isFile()) continue;
    await cp(src, dst, { force: true });
    console.log(`[copy] ${f} → report/`);
  }
}

await copyExt(['.json', '.svg']);
console.log('[copy-public-assets] done');
