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
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.googleapis.com',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.gstatic.com',
						crossorigin: true,
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap',
					},
				},
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

						// Post-process SVG styles for dark mode contrast and HUD aesthetic
						const postProcessMermaid = () => {
							const isDark = document.documentElement.dataset.theme === 'dark';
							document.querySelectorAll('.mermaid svg').forEach((svg) => {
								svg.querySelectorAll('.warnnode').forEach((node) => {
									const shape = node.querySelector('polygon, rect, circle, path');
									if (shape) {
										if (isDark) {
											shape.style.setProperty('fill', 'rgba(220, 38, 38, 0.22)', 'important');
											shape.style.setProperty('stroke', '#ef4444', 'important');
										} else {
											shape.style.setProperty('fill', '#fff0f0', 'important');
											shape.style.setProperty('stroke', '#d9534f', 'important');
										}
									}
									const textNodes = node.querySelectorAll('p, span, div, text');
									textNodes.forEach((t) => {
										if (isDark) {
											t.style.setProperty('color', '#fee2e2', 'important');
											t.style.setProperty('fill', '#fee2e2', 'important');
										} else {
											t.style.setProperty('color', '#991b1b', 'important');
											t.style.setProperty('fill', '#991b1b', 'important');
										}
									});
								});
							});
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
								postProcessMermaid();
							} catch (err) {
								console.error('Mermaid render error:', err);
							}
						};

						// 2. Obsidian Callouts Renderer (transform blockquotes starting with [!type] into interactive <details>)
						const renderCallouts = () => {
							const blockquotes = document.querySelectorAll('.sl-markdown-content blockquote');
							blockquotes.forEach((bq) => {
								const firstP = bq.querySelector('p');
								if (!firstP) return;
								const text = firstP.textContent || '';
								const match = text.match(/^\\s*\\[!([a-zA-Z0-9_-]+)\\]([+-]?)\\s*(.*)$/);
								if (!match) return;

								const type = match[1].toLowerCase();
								const foldSign = match[2];
								const title = match[3].trim() || type.toUpperCase();

								const icons = {
									info: 'ℹ️',
									abstract: '📋',
									note: '📝',
									tip: '💡',
									warning: '⚠️',
									danger: '🚨',
								};
								const icon = icons[type] || '📌';

								// Remove the callout marker line from the first paragraph
								firstP.innerHTML = firstP.innerHTML.replace(/^\\s*\\[![a-zA-Z0-9_-]+\\][+-]?\\s*.*?(<br\\s*\\/?>|\\n|$)/i, '').trim();
								if (!firstP.textContent.trim() && firstP.children.length === 0) {
									firstP.remove();
								}

								const details = document.createElement('details');
								details.className = 'obsidian-callout callout-' + type;
								if (foldSign !== '-') {
									details.open = true;
								}

								const summary = document.createElement('summary');
								summary.className = 'callout-summary';
								summary.innerHTML = '<span class="callout-icon">' + icon + '</span> <span class="callout-title">' + title + '</span>';
								details.appendChild(summary);

								const body = document.createElement('div');
								body.className = 'callout-body';
								while (bq.firstChild) {
									body.appendChild(bq.firstChild);
								}
								details.appendChild(body);

								bq.parentElement?.replaceChild(details, bq);
							});
						};

						// 3. Interactive Collapsible Sections with Auto-Collapse for §6+
						const initCollapsibleSections = () => {
							if (document.querySelector('.hero')) return;
							const content = document.querySelector('.sl-markdown-content');
							if (!content || content.dataset.collapsibleInit === 'true') return;
							content.dataset.collapsibleInit = 'true';

							const headings = Array.from(content.querySelectorAll('.sl-heading-wrapper.level-h2'));
							if (headings.length === 0) return;

							// Add Quick Actions Toolbar at top
							const toolbar = document.createElement('div');
							toolbar.className = 'section-action-toolbar not-content';
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
							window.expandTarget = expandTarget;

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

						// 4. Precision HUD Checklist Widget for Right Sidebar (Dynamic per Card)
						const initHudChecklist = () => {
							const toc = document.querySelector('starlight-toc');
							if (!toc || !toc.parentElement || document.querySelector('.hud-checklist-card')) return;

							const pathname = window.location.pathname;
							
							const CHECKLISTS = {
								'co00-overview-flowcharts': {
									title: '全景总控考点核验',
									badge: '7项核心',
									items: [
										{ label: '十三张主卡三个维度', en: '13 Main Cards Dimensions', href: '#1-十三张主卡的三个维度' },
										{ label: '诉前送达与诉答状态机', en: 'Pre-Action to Pleadings Flow', href: '#21-诉前送达诉答与审前拦截' },
										{ label: '证据案管正审状态机', en: 'Evidence & Trial Flow', href: '#22-证据案管正审执行及上诉' },
										{ label: '审前取判与剔除对比', en: 'Default / Summary / Strike-out', href: '#31-审前取判与剔除' },
										{ label: '金钱资产费用保障对比', en: 'Interim Payment / Mareva / Security', href: '#32-金钱资产及费用保障' },
										{ label: '获取资料与保存证据', en: 'Discovery / Norwich Pharmacal', href: '#33-获取资料与保存证据' },
										{ label: '撤销宽免上诉与暂缓', en: 'Set Aside / Relief / Stay', href: '#34-撤销宽免上诉和暂缓' },
									]
								},
								'co00-deadlines-case-matrix': {
									title: '时限与判例速查清单',
									badge: '7大核心',
									items: [
										{ label: '算日规则与诉前起算', en: 'O.3 r.2 & Pre-Action', href: '#算日与诉前' },
										{ label: '起诉送达诉答时限表', en: 'Writ / Service / Pleadings', href: '#起诉送达与诉答' },
										{ label: '审前拦截与和解时钟', en: 'Default / O.14 / O.22', href: '#审前拦截与和解' },
										{ label: '证据案管审讯时钟', en: 'Discovery / CMC / PTR', href: '#证据案管与审讯' },
										{ label: '讼费执行上诉时钟', en: 'Costs / Enforcement / Appeals', href: '#讼费执行及上诉' },
										{ label: '横向切割与联动判例', en: 'Cross-Boundary Precedents', href: '#a横向切割与联动' },
										{ label: '一案一死穴阶段防线', en: 'Single-Case Fatal Traps', href: '#c按阶段的一案一死穴' },
									]
								},
								'co00-exam-sg-router': {
									title: '考试题眼与路由清单',
									badge: '7项实战',
									items: [
										{ label: '原告题眼选程序表', en: 'Plaintiff / Applicant Signals', href: '#表-1原告或申请人' },
										{ label: '被告题眼选程序表', en: 'Defendant / Respondent Signals', href: '#表-2被告或答辩人' },
										{ label: 'SG01–SG05 进阶映射', en: 'SG01–SG05 Progression', href: '#21-sg01sg10-进阶映射' },
										{ label: 'SG06–SG10 实操映射', en: 'SG06–SG10 Practice Mapping', href: '#21-sg01sg10-进阶映射' },
										{ label: '历年真题复合路线', en: 'Past Paper Complex Routes', href: '#22-真题复合路线' },
										{ label: '侵权与火灾专题路线', en: 'Tort & Arson Review Route', href: '#22-真题复合路线' },
										{ label: '旧评分与现行规则冲突', en: 'Scoresheet vs Current RHC/RDC', href: '#23-旧评分与现行规则冲突时的核法' },
									]
								},
								'co01': {
									title: '接案与诉前核验清单',
									badge: '7项核心',
									items: [
										{ label: '利益冲突回避检索', en: 'Conflict Check', href: '#0b-接案retainer-与-pg-flap-事实调查' },
										{ label: '委托与董事会授权', en: 'Retainer & Resolution', href: '#0b-接案retainer-与-pg-flap-事实调查' },
										{ label: '五层事实调查模型', en: 'PG-FLAP Investigation', href: '#0b-接案retainer-与-pg-flap-事实调查' },
										{ label: '管辖法院层级划分', en: 'Jurisdiction & Transfer', href: '#速读定位层' },
										{ label: '法定诉讼时效核验', en: 'Limitation & Protective Writ', href: '#速读定位层' },
										{ label: '诉前催告函六步解剖', en: 'LBA Drafting Framework', href: '#0b-接案retainer-与-pg-flap-事实调查' },
										{ label: '诉前行为与讼费告诫', en: 'Costs Warnings & PD 18.1', href: '#速读定位层' },
									]
								},
								'co03': {
									title: '送达与认收核验清单',
									badge: '7项核心',
									items: [
										{ label: '域内自然人规范送达', en: 'Personal Service O.10', href: '#0d-域内送达与-affirmation-of-service' },
										{ label: '公司注册处法定送达', en: 'Companies Ordinance s.827', href: '#0e-特殊主体与-substituted-service' },
										{ label: '替代送达四步申请', en: 'Substituted Service O.65', href: '#0e-特殊主体与-substituted-service' },
										{ label: '域外管辖网格申请', en: 'Service out of Jurisdiction O.11', href: '#0b-送达aos-与管辖权异议总框架' },
										{ label: '推定送达日算术核对', en: 'Deemed Service & Clear Days', href: '#0c-时间计算与-deemed-service' },
										{ label: '认收书时限与登案', en: 'Acknowledgement of Service O.12', href: '#0b-送达aos-与管辖权异议总框架' },
										{ label: '管辖权异议程序防御', en: 'Dispute Jurisdiction O.12 r.8', href: '#0b-送达aos-与管辖权异议总框架' },
									]
								},
								'co04': {
									title: '诉答起草与抗辩清单',
									badge: '7项核心',
									items: [
										{ label: '实质事实并非证据', en: 'Material Facts not Evidence', href: '#0b-诉答功能material-facts-与证据边界' },
										{ label: '真实陈述书签署核验', en: 'Statement of Truth O.41A', href: '#0b-诉答功能material-facts-与证据边界' },
										{ label: '针对性逐条抗辩', en: 'Specific Traverse & Admissions', href: '#0b-诉答功能material-facts-与证据边界' },
										{ label: '抵销与独立反申索', en: 'Set-off vs Counterclaim', href: '#0b-诉答功能material-facts-与证据边界' },
										{ label: '第三方责任分担程序', en: 'Third Party Notice O.16', href: '#0b-诉答功能material-facts-与证据边界' },
										{ label: '诉答文书修改通道', en: 'Amendments O.20', href: '#0c-诉答时序期限与-close-of-pleadings' },
										{ label: '滥用程序剔除申请', en: 'Striking Out O.18 r.19', href: '#0b-诉答功能material-facts-与证据边界' },
									]
								},
								'co06': {
									title: '审前判决与处分清单',
									badge: '7项核心',
									items: [
										{ label: '未认收缺席判决', en: 'Default in AOS O.13', href: '#0b-审前取判路径与程序状态' },
										{ label: '未抗辩缺席判决预警', en: 'Default of Defence O.19 (2 Days)', href: '#0b-审前取判路径与程序状态' },
										{ label: '诉讼自认与分期偿付', en: 'Admissions Form 16 / O.13A', href: '#0b-审前取判路径与程序状态' },
										{ label: '违规判决应计撤销', en: 'Set Aside Ex Debito Justitiae', href: '#0b-审前取判路径与程序状态' },
										{ label: '常规简易判决准入', en: 'Summary Judgment O.14', href: '#0b-审前取判路径与程序状态' },
										{ label: '抗辩许可三分支裁量', en: 'Triable Issue & Conditional Leave', href: '#0b-审前取判路径与程序状态' },
										{ label: '暂定付款法定触发', en: 'Interim Payment O.29', href: '#0b-审前取判路径与程序状态' },
									]
								},
								'co07': {
									title: '传票申请与费用担保清单',
									badge: '7项核心',
									items: [
										{ label: '内庭传票法定起草', en: 'Interlocutory Summons O.32', href: '#0b-中间申请命令与-security-for-costs-总框架' },
										{ label: '2 Clear Days 送达规则', en: 'Service Deadlines O.32 r.3', href: '#0b-中间申请命令与-security-for-costs-总框架' },
										{ label: '同意传票与同意令', en: 'Consent Summons & Orders O.42', href: '#0b-中间申请命令与-security-for-costs-总框架' },
										{ label: '常居境外费用担保', en: 'Foreign Resident O.23 r.1(1)(a)', href: '#0b-中间申请命令与-security-for-costs-总框架' },
										{ label: '无力偿债公司担保', en: 'Insolvent Company s.905', href: '#0b-中间申请命令与-security-for-costs-总框架' },
										{ label: '担保金额合理估算', en: 'Quantum Assessment of Security', href: '#0b-中间申请命令与-security-for-costs-总框架' },
										{ label: '即席讼费评定与执行', en: 'Summary Assessment & Pay in 14d', href: '#0b-中间申请命令与-security-for-costs-总框架' },
									]
								},
								'co08': {
									title: '证据准备与披露清单',
									badge: '7项核心',
									items: [
										{ label: '自动披露与文件清单', en: 'List of Documents O.24 r.2', href: '#0b-证据准备总框架三大核心支柱时序主干与程序推进' },
										{ label: 'Peruvian Guano 关联测试', en: 'Train of Inquiry Relevance', href: '#0c-o24-自动披露范围peruvian-guano-口径与-list-of-documents-结构' },
										{ label: '法律专业特权核验', en: 'Legal Professional Privilege', href: '#0b-证据准备总框架三大核心支柱时序主干与程序推进' },
										{ label: '默示承诺禁止滥用', en: 'Implied Undertaking Harman', href: '#0b-证据准备总框架三大核心支柱时序主干与程序推进' },
										{ label: '特定文件披露申请', en: 'Specific Discovery O.24 r.7', href: '#0b-证据准备总框架三大核心支柱时序主干与程序推进' },
										{ label: '证人陈述书事实界限', en: 'Witness Statements O.38', href: '#0b-证据准备总框架三大核心支柱时序主干与程序推进' },
										{ label: '独立专家证人指引', en: 'Expert Reports & Code PD 22', href: '#0b-证据准备总框架三大核心支柱时序主干与程序推进' },
									]
								},
								'co11': {
									title: '案件管理与审讯组织清单',
									badge: '7项核心',
									items: [
										{ label: '排期问卷倒排填写', en: 'Timetabling Questionnaire', href: '#0c-timetabling-questionnaire-逐栏填写逻辑' },
										{ label: '调解证书提交死线', en: 'Mediation Certificate PD 31', href: '#0b8-调解与和解机制pd-31-调解程序与讼费制裁杠杆' },
										{ label: '三大不可动摇里程碑', en: '3 Milestone Dates (CMC/PTR/Trial)', href: '#0b6-里程碑日期-vs-非里程碑日期更改规则对照' },
										{ label: '非里程碑时限合意调整', en: 'Non-Milestone Consent O.25 r.1B', href: '#0d1-三个渠道与两个例外' },
										{ label: '除非命令与违规制裁', en: 'Unless Order & Strike Out', href: '#0e1-unless-order-的作出making-of-order形式要求与相称性' },
										{ label: '制裁宽免五维裁量', en: 'Relief from Sanctions O.2 r.5', href: '#0e3-relief-from-sanctions14-日窗口传票誓章十因素裁量' },
										{ label: '审前复核与正式排期', en: 'PTR, Bundles & Setting Down', href: '#0f1-ptr审前覆核法院预期的备审成果展示' },
									]
								},
								'co13': {
									title: '程序准入核验清单',
									badge: '7项核心',
									items: [
										{ label: '实体权利基础', en: 'Cause of Action', href: '#0b1-禁制令的性质权源与管辖' },
										{ label: '严重待决争点', en: 'Serious Question', href: '#0b4-american-cyanamid按顺序审查争点赔偿与不公风险' },
										{ label: '损害赔偿不足', en: 'Inadequacy of Damages', href: '#0b4-american-cyanamid按顺序审查争点赔偿与不公风险' },
										{ label: '赔偿承诺与担保', en: 'Cross-undertaking', href: '#0c-损害赔偿承诺与强化担保' },
										{ label: '便利与损害平衡', en: 'Balance of Convenience', href: '#0b4-american-cyanamid按顺序审查争点赔偿与不公风险' },
										{ label: '充分坦白披露', en: 'Full & Frank Disclosure', href: '#0d-单方申请与充分而坦白的披露' },
										{ label: '资产散失真实风险', en: 'Risk of Dissipation', href: '#0e2-准入条件与证据' },
									]
								}
							};

							let currentCard = null;
							for (const key of Object.keys(CHECKLISTS)) {
								if (pathname.includes(key)) {
									currentCard = key;
									break;
								}
							}
							if (!currentCard && pathname.includes('co13')) currentCard = 'co13';
							if (!currentCard) return;
							const config = CHECKLISTS[currentCard];
							if (!config) return;

							const widget = document.createElement('div');
							widget.className = 'hud-checklist-card not-content';
							
							const itemsHtml = config.items.map(function(it) {
								return '<a href="' + it.href + '" class="hud-check-item">' +
									'<span class="hud-check-icon">✓</span>' +
									'<span class="hud-check-label">' + it.label + ' <span class="hud-en">' + it.en + '</span></span>' +
								'</a>';
							}).join('');

							widget.innerHTML = 
								'<div class="hud-checklist-header">' +
									'<div class="hud-header-title">' +
										'<span class="hud-pulse-dot"></span>' +
										'<span class="hud-title-text">' + config.title + '</span>' +
									'</div>' +
									'<span class="hud-badge-count">' + config.badge + '</span>' +
								'</div>' +
								'<div class="hud-checklist-items">' +
									itemsHtml +
								'</div>';

							toc.parentElement.insertBefore(widget, toc);

							widget.querySelectorAll('.hud-check-item').forEach((a) => {
								a.addEventListener('click', () => {
									const hash = a.getAttribute('href')?.replace(/^#/, '');
									if (hash && window.expandTarget) window.expandTarget(decodeURIComponent(hash));
								});
							});
						};

						const setup = () => {
							renderMermaid();
							renderCallouts();
							initCollapsibleSections();
							initHudChecklist();
						};

						if (!window.__themeObserverSet) {
							window.__themeObserverSet = true;
							const themeObserver = new MutationObserver((mutations) => {
								for (const m of mutations) {
									if (m.attributeName === 'data-theme') {
										postProcessMermaid();
									}
								}
							});
							themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
						}

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
					label: '🧭 全景总括与时钟体系 (Master & Tools)',
					items: [
						{ label: 'CO00 · 全科总览与程序图', slug: 'master/co00-overview-flowcharts' },
						{ label: 'CO00 · 期限与判例矩阵', slug: 'master/co00-deadlines-case-matrix' },
						{ label: 'CO00 · 考试与 SG 决策路由', slug: 'master/co00-exam-sg-router' },
					],
				},
				{
					label: '🏛️ 制度凝结层 (Institutions 01–13)',
					items: [
						{ label: 'CO01 · 接案指示、诉前行为与 LBA', slug: 'institutions/co01-taking-instructions' },
						{ label: 'CO03 · 送达、诉讼认收与管辖权异议', slug: 'institutions/co03-service-and-aos' },
						{ label: 'CO04-05-10 · 诉答文书、抗辩与第三方程序', slug: 'institutions/co04-05-10-pleadings' },
						{ label: 'CO06-09 · 审前判决、自认与中期付款', slug: 'institutions/co06-09-pre-trial-judgments' },
						{ label: 'CO07 · 传票起草、命令与诉讼费用担保', slug: 'institutions/co07-summonses-and-orders' },
						{ label: 'CO08 · 证据准备体系：披露、证人与专家', slug: 'institutions/co08-evidence-preparation' },
						{ label: 'CO11 · 案件管理与审讯组织体系', slug: 'institutions/co11-case-management' },
						{ label: 'CO13 · 临时救济与风险保障体系', slug: 'institutions/co13-interim-relief' },
					],
				},
			],
		}),
	],
});
