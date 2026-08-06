import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://depthlume.com',
  output: 'static',
  integrations: [sitemap()],
  build: { format: 'directory' },
  security: { checkOrigin: true },
});
