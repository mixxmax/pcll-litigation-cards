// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://mixxmax.github.io',
	base: '/pcll-litigation-cards',
	integrations: [
		starlight({
			title: 'PCLL Civil Litigation',
			description: '香港民事诉讼制度凝结层与程序救济在线系统',
			defaultLocale: 'root',
			locales: {
				root: {
					label: '简体中文',
					lang: 'zh-CN',
				},
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/mixxmax/pcll-litigation-cards' }
			],
			customCss: [
				'./src/styles/custom.css',
			],
			head: [
				{
					tag: 'script',
					attrs: {
						type: 'module',
					},
					content: `
						import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
						const isDark = document.documentElement.dataset.theme === 'dark';
						mermaid.initialize({
							startOnLoad: false,
							theme: isDark ? 'dark' : 'neutral',
							securityLevel: 'loose',
							fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
						});

						const decodeEntities = (str) => {
							const textarea = document.createElement('textarea');
							textarea.innerHTML = str;
							return textarea.value;
						};

						const renderMermaid = async () => {
							const pres = document.querySelectorAll('pre[data-language="mermaid"]');
							if (pres.length === 0) return;

							pres.forEach((pre) => {
								const lines = pre.querySelectorAll('.ec-line');
								let rawText = '';
								if (lines.length > 0) {
									rawText = Array.from(lines).map(l => l.textContent).join('\\n');
								} else {
									rawText = pre.textContent || '';
								}
								rawText = decodeEntities(rawText);

								const container = pre.closest('.expressive-code') || pre;
								const div = document.createElement('div');
								div.className = 'mermaid';
								div.textContent = rawText;
								container.parentElement.replaceChild(div, container);
							});

							try {
								await mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
							} catch (err) {
								console.error('Mermaid render error:', err);
							}
						};

						if (document.readyState === 'loading') {
							document.addEventListener('DOMContentLoaded', renderMermaid);
						} else {
							renderMermaid();
						}
						document.addEventListener('astro:page-load', renderMermaid);
					`
				}
			],
			sidebar: [
				{
					label: '🏛️ 制度凝结层 (Institutions)',
					items: [
						{ label: 'CO13 · 临时救济与风险保障体系', slug: 'institutions/co13-interim-relief' },
					],
				},
			],
		}),
	],
});
