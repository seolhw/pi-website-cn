import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pageSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	slug: z.string().optional(),
}).loose();

export const collections = {
	docs: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
		schema: pageSchema,
	}),
	changelog: defineCollection({
		loader: glob({ pattern: 'CHANGELOG.md', base: './src/pi/coding-agent' }),
		schema: pageSchema,
	}),
	home: defineCollection({
		loader: glob({ pattern: 'index.mdx', base: './src/content/docs' }),
		schema: pageSchema,
	}),
};
