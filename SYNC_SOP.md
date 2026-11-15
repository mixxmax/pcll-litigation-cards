# PCLL 诉讼法凝结层知识库与 Starlight 网页同步标准作业程序（SOP）

本指南用于交付给任何 AI 助手（如 Claude、Gemini、GPT 等），以确保在用户修改了 Obsidian 本地库（`03 Condensation/`）中的任何卡片后，能够 100% 稳定、无损、零报错地将改动同步至 Starlight 前端网站并部署上线。

---

## 一、 核心环境与绝对路径映射

- **工作操作系统**：macOS (zsh)
- **前端工具链**：`bun` (已全局安装), `Astro / Starlight`
- **本地 Obsidian 笔记根目录**：  
  `/Users/xiezhijie/Desktop/pcll课程/Civil Litigation (PCLL8010)/03 Condensation/`
- **前端网页工程根目录**：  
  `/Users/xiezhijie/pcll-starlight`
- **文档内容目录**：  
  `/Users/xiezhijie/pcll-starlight/src/content/docs/`
- **前端全局配置与 HUD 导航文件**：  
  `/Users/xiezhijie/pcll-starlight/astro.config.mjs`

### 完整文件映射对照表

| 类别 | Obsidian 本地卡片路径（源文件） | Starlight 网页对应路径（目标文件） |
| :--- | :--- | :--- |
| **Master** | `00 Master/[CO00] Litigation System Master Overview & Procedural Flowcharts.md` | `src/content/docs/master/co00-overview-flowcharts.md` |
| **Master** | `00 Master/[CO00] Litigation System Master Deadlines & Case Matrix.md` | `src/content/docs/master/co00-deadlines-case-matrix.md` |
| **Master** | `00 Master/[CO00] Litigation System Master Exam & Small Group Router.md` | `src/content/docs/master/co00-exam-sg-router.md` |
| **机构卡** | `01 Institutions/[CO01] Taking Instructions and Originating Process.md` | `src/content/docs/institutions/co01-taking-instructions.md` |
| **机构卡** | `01 Institutions/[CO03] Service and Acknowledgement of Service.md` | `src/content/docs/institutions/co03-service-and-aos.md` |
| **机构卡** | `01 Institutions/[CO04-05-10] Pleadings, Defence and Third Party Proceedings.md` | `src/content/docs/institutions/co04-05-10-pleadings.md` |
| **机构卡** | `01 Institutions/[CO06-09] Pre-trial Dispositions, Admissions and Interim Payments.md` | `src/content/docs/institutions/co06-09-pre-trial-judgments.md` |
| **机构卡** | `01 Institutions/[CO07] Interlocutory Summonses, Orders and Security for Costs.md` | `src/content/docs/institutions/co07-summonses-and-orders.md` |
| **机构卡** | `01 Institutions/[CO08] Evidence Preparation System.md` | `src/content/docs/institutions/co08-evidence-preparation.md` |
| **机构卡** | `01 Institutions/[CO11] Case Management and Trial Organisation System.md` | `src/content/docs/institutions/co11-case-management.md` |
| **机构卡** | `01 Institutions/[CO13] Interim Injunctions and Asset Preservation System.md` | `src/content/docs/institutions/co13-interim-relief.md` |

---

## 二、 关键同步规则与避坑指南（铁律）

### 1. Frontmatter（YAML 元数据）处理规则
Starlight 的文档必须包含 `title` 和 `description`，但 Obsidian 原稿库部分卡片本身不含 `title`，部分卡片含有 `title`。
- **严禁重复键名（Duplicate Keys）**：Astro 编译时若出现重复的 `title:` 或 `description:` 会直接报错中断（`Map keys must be unique`）。
- **标准拼接方式**：
  读取源文件时，必须先将源文件 YAML 中的原有 `title:` 和 `description:` 过滤掉，然后将该卡片专用的官方 `title` 与 `description` 前置拼接入 frontmatter。
- **清除 `课表来源:` 中的 markdown 链接**：
  Obsidian 中若包含 `课表来源: "[...](obsidian://...)"`，在网页端须清洗为纯字符串 `"PCLL PT Yr1 (General)/2026-27 1st Sem PT YR1 PCLL Timetable (24.08.2026).xlsx"`。

### 2. 标题变更与 HUD 检查清单（CHECKLISTS）联动
在 `astro.config.mjs` 中定义了右侧/顶部悬浮的 HUD 核验清单（`CHECKLISTS`），其中的 `href` 均为锚点（如 `href: '#0c-timetabling-questionnaire-逐栏填写逻辑'`）。
- **Astro 的 Slug 生成算法（github-slugger）**：
  - 点号 `.` 会被直接删除（例如 `### 0B.8 调解` 生成的 ID 是 `0b8-调解`，而不是 `0b-8-调解`）；
  - 英文大写转为小写；
  - 空格、冒号、斜杠转为中划线 `-`，且多个中划线会合并。
- **规则**：若同步的内容中修改了任何在 `CHECKLISTS` 中被引用的 H2/H3 标题，**必须同步修改 `astro.config.mjs` 对应的 `href` 锚点**，否则会导致网页跳转失效。

### 3. 内容保全原则（Non-Destructive）
- 100% 完整保留正文所有法律论述、法条依据、时限数字、判例引述以及 `〔...〕` 考据出处标签；
- 严禁擅自压缩、精简或删减原稿内容。

---

## 三、 标准化同步执行流程（5 步走）

### 第 1 步：执行 Python 同步脚本
使用以下通用 Python 模板（以同步 `CO11` 为例，替换路径即可用于任何卡片）：

```python
import os

vault_path = '/Users/xiezhijie/Desktop/pcll课程/Civil Litigation (PCLL8010)/03 Condensation/01 Institutions/[CO11] Case Management and Trial Organisation System.md'
web_path = '/Users/xiezhijie/pcll-starlight/src/content/docs/institutions/co11-case-management.md'

# 各卡片预设的 Starlight title 与 description 字典
META_MAP = {
    'co11-case-management.md': (
        'CO11 · 案件管理与审讯组织体系',
        '香港大学 PCLL8010 Civil Litigation 案件管理与审讯组织体系：从 pleadings 结案、排期问卷 (TQ)、CMC/PTR 到开审组织与制裁救济。'
    ),
    # 其它卡片如需同步直接增补映射
}

with open(vault_path, 'r', encoding='utf-8') as f:
    content = f.read()

parts = content.split('---', 2)
if len(parts) >= 3:
    v_fm = parts[1].strip()
    v_body = parts[2]
else:
    raise ValueError('No YAML frontmatter found in vault file!')

filename = os.path.basename(web_path)
title, desc = META_MAP.get(filename, ('', ''))

fm_lines = []
for line in v_fm.splitlines():
    k = line.split(':', 1)[0].strip()
    if k in ('title', 'description'):
        continue
    if line.startswith('课表来源:'):
        fm_lines.append('课表来源: "PCLL PT Yr1 (General)/2026-27 1st Sem PT YR1 PCLL Timetable (24.08.2026).xlsx"')
    else:
        fm_lines.append(line)

new_fm = f'---\ntitle: "{title}"\ndescription: "{desc}"\n' + '\n'.join(fm_lines) + '\n---\n'
new_web_content = new_fm + v_body.lstrip('\r\n')

with open(web_path, 'w', encoding='utf-8') as f:
    f.write(new_web_content)

print(f'Successfully updated: {web_path}')
```

---

### 第 2 步：核对与更新 HUD 锚点（若有改动标题）
若修改了 H2/H3 标题，检查 `/Users/xiezhijie/pcll-starlight/astro.config.mjs` 中对应的卡片 `CHECKLISTS` 配置，确保 `href: '#...'` 与生成的 HTML 锚点完全一致。

---

### 第 3 步：运行静态编译验证
在项目根目录下运行打包命令：
```bash
cd /Users/xiezhijie/pcll-starlight && CI=true bun run build
```
- **通过标准**：命令必须以 `code 0` 退出，且最后显示 `Complete!`。
- **若报错**：
  - 提示 `Map keys must be unique` $\rightarrow$ 检查并移除重复的 frontmatter 键名；
  - 提示 `Cannot find module` 或语法错误 $\rightarrow$ 检查 markdown 表格或代码块是否未闭合。

---

### 第 4 步：校验 HTML 锚点存在性（推荐）
在 `dist/` 编译产物中检查锚点是否真实存在：
```bash
python3 -c "
with open('/Users/xiezhijie/pcll-starlight/dist/institutions/co11-case-management/index.html') as f:
    html = f.read()
assert 'id=\"0c-timetabling-questionnaire-逐栏填写逻辑\"' in html
print('Verified: Anchor exists!')
"
```

---

### 第 5 步：提交并推送到 GitHub Pages 远程仓库
编译通过后，提交 Git 并推送到远程 `main` 分支触发自动化部署：
```bash
cd /Users/xiezhijie/pcll-starlight
git add .
git commit -m "feat(<card>): sync user updates from vault to web"
git push origin main
```
确认终端输出 `main -> main` 即代表同步部署成功！
