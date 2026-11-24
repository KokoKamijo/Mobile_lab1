import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getProducts } from '../db/database.js';
import { escapeHtml, renderPage } from '../lib/render.js';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const basePath = repositoryName && !repositoryName.endsWith('.github.io')
  ? `/${encodeURIComponent(repositoryName)}`
  : '';
const outputDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const sourceDirectory = fileURLToPath(new URL('../public/', import.meta.url));
const products = getProducts();
const baht = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });

function writePage(relativePath, content) {
  const filePath = path.join(outputDirectory, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

mkdirSync(outputDirectory, { recursive: true });

writePage('index.html', readFileSync(path.join(sourceDirectory, 'index.html'), 'utf8'));
writePage('ssg/index.html', renderPage({
  mode: 'SSG',
  where: 'สร้างหน้าเว็บล่วงหน้าตอน build แล้วให้บริการเป็นไฟล์ static',
  products,
  basePath,
}));
writePage('ssr/index.html', renderPage({
  mode: 'SSR',
  where: 'หน้าแสดงผล SSR ที่สร้างไว้ล่วงหน้าสำหรับ GitHub Pages',
  products,
  basePath,
}));
writePage(
  'csr/index.html',
  readFileSync(path.join(sourceDirectory, 'csr/index.html'), 'utf8')
    .replace('data-products-url="/api/products"', `data-products-url="${basePath}/api/products.json"`),
);
copyFileSync(path.join(sourceDirectory, 'csr/app.js'), path.join(outputDirectory, 'csr/app.js'));

const adminRows = products.map((product) => `
          <tr>
            <th scope="row">${escapeHtml(product.name)}</th>
            <td>${baht.format(product.price)}</td>
          </tr>`).join('');
writePage('admin/index.html', `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>สินค้า</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body class="mode-admin">
  <header class="site"><a href="../" class="home">ร้านโน้ตบุ๊ก</a><p class="badge">สินค้า</p></header>
  <main>
    <nav class="page-nav" aria-label="เมนูหลัก">
      <a href="../">หน้าแรก</a>
      <a href="../ssg/">SSG</a>
      <a href="../ssr/">SSR</a>
      <a href="../csr/">CSR</a>
      <a href="./">สินค้า</a>
    </nav>
    <h1>สินค้าและราคา</h1>
    <p class="lead">รายการสินค้าจากฐานข้อมูลตัวอย่าง</p>
    <div class="table-wrap">
      <table>
        <caption>ราคา ณ เวลาที่เว็บไซต์ถูก build</caption>
        <thead><tr><th scope="col">รุ่น</th><th scope="col">ราคา (บาท)</th></tr></thead>
        <tbody>${adminRows}
        </tbody>
      </table>
    </div>
  </main>
  <footer class="site"><p>หน้าแสดงข้อมูลแบบ static</p></footer>
</body>
</html>`);

writePage('api/products.json', `${JSON.stringify(products, null, 2)}\n`);
for (const asset of ['style.css', 'secure-check.js']) {
  copyFileSync(path.join(sourceDirectory, asset), path.join(outputDirectory, asset));
}

console.log('สร้างหน้าแรก, SSG, SSR, CSR, สินค้า และ JSON สำหรับ GitHub Pages ใน dist/ แล้ว');
