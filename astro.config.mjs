// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://pi.dev',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],

  markdown: {
      shikiConfig: {
          themes: { light: 'github-light-default', dark: 'github-dark-default' },
          defaultColor: false,
      },
	},

  adapter: cloudflare(),
});