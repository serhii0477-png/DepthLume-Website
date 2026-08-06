import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const locales = [
  { prefix:'', lang:'en' }, { prefix:'uk', lang:'uk' }, { prefix:'ru', lang:'ru' },
  { prefix:'es', lang:'es' }, { prefix:'pt-br', lang:'pt-BR' }, { prefix:'de', lang:'de' },
  { prefix:'tr', lang:'tr' }, { prefix:'zh-cn', lang:'zh-CN' },
];
const pages = ['', 'documentation', 'closed-beta', 'privacy', 'terms', 'risk-disclaimer'];
const failures = [];
const htmlFiles = [];

for (const locale of locales) {
  for (const page of pages) {
    const route = `/${locale.prefix ? `${locale.prefix}/` : ''}${page ? `${page}/` : ''}`;
    const file = join(dist, route.replace(/^\//,''), 'index.html');
    if (!existsSync(file)) { failures.push(`Missing route ${route}`); continue; }
    htmlFiles.push(file);
    const html = readFileSync(file, 'utf8');
    const canonical = `https://depthlume.com${route}`;
    if (!html.includes(`<html lang="${locale.lang}" dir="ltr">`)) failures.push(`Wrong lang for ${route}`);
    if (!html.includes(`rel="canonical" href="${canonical}"`)) failures.push(`Wrong canonical for ${route}`);
    const alternateCount = (html.match(/rel="alternate" hreflang=/g) ?? []).length;
    if (alternateCount !== 9) failures.push(`Expected 9 hreflang links for ${route}, found ${alternateCount}`);
  }
}

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const target = match[1].split('#')[0].split('?')[0];
    if (!target || target.startsWith('/images/') || target.startsWith('/_astro/') || /\.[a-z0-9]+$/i.test(target)) continue;
    const targetFile = join(dist, target.replace(/^\//,''), 'index.html');
    if (!existsSync(targetFile)) failures.push(`Broken internal link ${target} in ${file}`);
  }
}

const publicHtml = htmlFiles.map((file) => readFileSync(file,'utf8')).join('\n');
for (const unsafe of ['WhaleHunter AI','72% confidence']) {
  if (publicHtml.includes(unsafe)) failures.push(`Unsafe public text found: ${unsafe}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Validated ${htmlFiles.length} localized public routes, SEO alternates, links and unsafe-text exclusions.`);
