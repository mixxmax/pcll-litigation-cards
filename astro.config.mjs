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

						// 1. Mermaid Flowchart Renderer
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

						// 2. Interactive Collapsible Sections with Auto-Collapse for §6+
						const initCollapsibleSections = () => {
							const content = document.querySelector('.sl-markdown-content');
							if (!content || content.dataset.collapsibleInit === 'true') return;
							content.dataset.collapsibleInit = 'true';

							const headings = Array.from(content.querySelectorAll('.sl-heading-wrapper.level-h2'));
							if (headings.length === 0) return;

							// Add Quick Actions Toolbar at top
							const toolbar = document.createElement('div');
							toolbar.className = 'section-action-toolbar';
							toolbar.innerHTML = \`
								<span class="toolbar-label">章节快速折叠：</span>
								<button type="button" class="action-btn" id="btn-expand-all">全部展开</button>
								<button type="button" class="action-btn" id="btn-collapse-all">全部折叠</button>
								<button type="button" class="action-btn is-active" id="btn-collapse-audit">仅保留核心正文 (§1–§6)</button>
							\`;
							content.insertBefore(toolbar, content.firstChild);

							let passedSix = false;

							headings.forEach((headingWrapper) => {
								const h2 = headingWrapper.querySelector('h2');
								const text = h2 ? h2.textContent.trim() : '';

								// Check if section is part of §6+ audit/history/log
								if (
									text.startsWith('0. 辐射范围') ||
									text.startsWith('7.') ||
									text.startsWith('0L.') ||
									text.startsWith('8.') ||
									text.includes('留痕') ||
									text.includes('记录') ||
									text.includes('更新') ||
									text.includes('校核')
								) {
									passedSix = true;
								}

								const shouldCollapse = passedSix;

								// Collect siblings until next H2 wrapper or end
								const bodyNodes = [];
								let next = headingWrapper.nextSibling;
								while (next && !(next.nodeType === 1 && next.classList.contains('level-h2') && next.classList.contains('sl-heading-wrapper'))) {
									const current = next;
									next = next.nextSibling;
									bodyNodes.push(current);
								}

								// Create collapsible container
								const sectionBody = document.createElement('div');
								sectionBody.className = 'collapsible-section-body';
								if (shouldCollapse) {
									sectionBody.style.display = 'none';
								}

								headingWrapper.parentNode.insertBefore(sectionBody, next);
								bodyNodes.forEach(node => sectionBody.appendChild(node));

								// Mark heading as interactive
								headingWrapper.classList.add('collapsible-heading');
								headingWrapper.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');

								const chevron = document.createElement('span');
								chevron.className = 'section-chevron';
								chevron.textContent = shouldCollapse ? '▶' : '▼';
								headingWrapper.insertBefore(chevron, headingWrapper.firstChild);

								// Toggle on click
								headingWrapper.addEventListener('click', (e) => {
									if (e.target.closest('.sl-anchor-link')) return;
									const isExpanded = headingWrapper.getAttribute('aria-expanded') === 'true';
									if (isExpanded) {
										sectionBody.style.display = 'none';
										headingWrapper.setAttribute('aria-expanded', 'false');
										chevron.textContent = '▶';
									} else {
										sectionBody.style.display = 'block';
										headingWrapper.setAttribute('aria-expanded', 'true');
										chevron.textContent = '▼';
									}
								});
							});

							// Quick Action Handlers
							toolbar.querySelector('#btn-expand-all')?.addEventListener('click', () => {
								headings.forEach((hw) => {
									hw.setAttribute('aria-expanded', 'true');
									const ch = hw.querySelector('.section-chevron');
									if (ch) ch.textContent = '▼';
									const body = hw.nextElementSibling;
									if (body && body.classList.contains('collapsible-section-body')) {
										body.style.display = 'block';
									}
								});
							});

							toolbar.querySelector('#btn-collapse-all')?.addEventListener('click', () => {
								headings.forEach((hw) => {
									hw.setAttribute('aria-expanded', 'false');
									const ch = hw.querySelector('.section-chevron');
									if (ch) ch.textContent = '▶';
									const body = hw.nextElementSibling;
									if (body && body.classList.contains('collapsible-section-body')) {
										body.style.display = 'none';
									}
								});
							});

							toolbar.querySelector('#btn-collapse-audit')?.addEventListener('click', () => {
								let pSix = false;
								headings.forEach((hw) => {
									const text = hw.querySelector('h2')?.textContent.trim() || '';
									if (
										text.startsWith('0. 辐射范围') ||
										text.startsWith('7.') ||
										text.startsWith('0L.') ||
										text.startsWith('8.') ||
										text.includes('留痕') ||
										text.includes('记录') ||
										text.includes('更新') ||
										text.includes('校核')
									) {
										pSix = true;
									}
									const exp = !pSix;
									hw.setAttribute('aria-expanded', exp ? 'true' : 'false');
									const ch = hw.querySelector('.section-chevron');
									if (ch) ch.textContent = exp ? '▼' : '▶';
									const body = hw.nextElementSibling;
									if (body && body.classList.contains('collapsible-section-body')) {
										body.style.display = exp ? 'block' : 'none';
									}
								});
							});

							// Auto-expand targeted section when clicking Right Sidebar TOC
							const expandTarget = (targetId) => {
								if (!targetId) return;
								const targetEl = document.getElementById(targetId);
								if (!targetEl) return;
								const parentBody = targetEl.closest('.collapsible-section-body');
								if (parentBody) {
									parentBody.style.display = 'block';
									const prevHeading = parentBody.previousElementSibling;
									if (prevHeading && prevHeading.classList.contains('collapsible-heading')) {
										prevHeading.setAttribute('aria-expanded', 'true');
										const chev = prevHeading.querySelector('.section-chevron');
										if (chev) chev.textContent = '▼';
									}
								}
							};

							document.querySelectorAll('starlight-toc a').forEach((a) => {
								a.addEventListener('click', () => {
									const hash = a.getAttribute('href')?.replace(/^#/, '');
									if (hash) expandTarget(decodeURIComponent(hash));
								});
							});

							window.addEventListener('hashchange', () => {
								const hash = window.location.hash.slice(1);
								if (hash) expandTarget(decodeURIComponent(hash));
							});

							// Initial hash check
							if (window.location.hash) {
								expandTarget(decodeURIComponent(window.location.hash.slice(1)));
							}
						};

						const setup = () => {
							renderMermaid();
							initCollapsibleSections();
						};

						if (document.readyState === 'loading') {
							document.addEventListener('DOMContentLoaded', setup);
						} else {
							setup();
						}
						document.addEventListener('astro:page-load', setup);
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
