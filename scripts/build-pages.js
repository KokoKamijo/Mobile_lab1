import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { getProducts } from '../db/database.js';
import { renderPage } from '../lib/render.js';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const basePath = repositoryName && !repositoryName.endsWith('.github.io')
  ? `/${encodeURIComponent(repositoryName)}`
  : '';
const outputDirectory = new URL('../dist/', import.meta.url);

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(new URL('index.html', outputDirectory), renderPage({
  mode: 'SSG',
  where: 'GitHub Actions สร้างหน้าเว็บแบบ static จากฐานข้อมูลตัวอย่าง',
  products: getProducts(),
  basePath,
}));
copyFileSync(new URL('../public/style.css', import.meta.url), new URL('style.css', outputDirectory));
copyFileSync(new URL('../public/secure-check.js', import.meta.url), new URL('secure-check.js', outputDirectory));

console.log('สร้างเว็บไซต์ static สำหรับ GitHub Pages ใน dist/ แล้ว');
