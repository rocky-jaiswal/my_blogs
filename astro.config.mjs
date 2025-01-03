// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';

// https://astro.build/config
export default defineConfig({
	site: 'https://rockyj-blogs.web.app',
	integrations: [expressiveCode({themes: ['dracula']}), mdx(), sitemap()],
	build: {
		format: 'file'
	}
});
