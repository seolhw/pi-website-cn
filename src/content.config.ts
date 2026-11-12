import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema, i18nSchema } from "@astrojs/starlight/schema";

export const collections = {
	docs: defineCollection({
		loader: docsLoader({
			generateId: ({ entry }) => {
				const normalizedEntry = entry.replace(/\\/g, '/');
				if (normalizedEntry === 'index.mdx') return 'index';
				if (normalizedEntry === 'index.md') return 'docs';
				if (normalizedEntry === '404.md') return '404';
				return `docs/${normalizedEntry.replace(/\.(?:md|mdx)$/, '').replace(/\/index$/, '')}`;
			},
		}),
		schema: docsSchema(),
	}),
	i18n: defineCollection({
		loader: glob({ pattern: "**/*.json", base: "./src/content/i18n" }),
		schema: i18nSchema(),
	}),
};
