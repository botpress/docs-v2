// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkRewriteLinks from './src/remark/plugins/rewrite-links.js'

import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'

//TODO: suggestion (non-blocking): No need for a barrel import. This can just import directly from each transformer individually.
import { transformerMetaHighlight } from '@shikijs/transformers'
import { baseUrl } from './src/const.js'
import { transformerFilename, transformerExpandable } from './src/shiki/transformers/index.js'

export default defineConfig({
  site: 'https://botpress.com',
  base: baseUrl,
  output: 'static',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    react(),
    mdx(),
    sitemap(),
    icon({ include: { 'simple-icons': ['react', 'wordpress', 'wix', 'webflow'] } }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@botpress/webchat',
        '@base-ui/react',
        '@nanostores/react',
        'nanostores',
        'lucide-react',
        'react-resizable-panels',
        'vaul',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
      ],
    },
  },
  markdown: {
    remarkPlugins: [remarkGfm, remarkRewriteLinks],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          properties: {
            className: ['heading-anchor'],
            ariaHidden: 'true',
            tabIndex: -1,
          },
          content: {
            type: 'element',
            tagName: 'svg',
            properties: {
              xmlns: 'http://www.w3.org/2000/svg',
              width: '12',
              height: '12',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            },
            children: [
              {
                type: 'element',
                tagName: 'path',
                properties: { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' },
                children: [],
              },
              {
                type: 'element',
                tagName: 'path',
                properties: { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
                children: [],
              },
            ],
          },
        },
      ],
    ],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [transformerFilename(), transformerExpandable(), transformerMetaHighlight()],
    },
  },
})
