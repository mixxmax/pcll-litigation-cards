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
						mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
						const renderMermaid = () => {
							const blocks = document.querySelectorAll('pre:has(code.language-mermaid)');
							blocks.forEach((pre) => {
								const code = pre.querySelector('code');
								if (code) {
									const div = document.createElement('div');
									div.className = 'mermaid';
									div.textContent = code.textContent;
									pre.parentElement.replaceChild(div, pre);
								}
							});
							mermaid.run();
						};
						if (document.readyState === 'loading') {
							document.addEventListener('DOMContentLoaded', renderMermaid);
						} else {
							renderMermaid();
						}
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
