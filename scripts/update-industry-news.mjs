import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ============================================================
// frontmatter 解析
// ============================================================

/**
 * 解析 mdx 文件的 YAML frontmatter
 * 返回 { title, date, author } 或 null
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;

  const fm = match[1];
  const result = {};

  // 提取 title / date / author（支持 title: 'xxx' 或 title: "xxx" 或 title: xxx）
  const titleMatch = fm.match(/^title:\s*['"]?([^'"\r\n]+)['"]?/m);
  if (titleMatch) result.title = titleMatch[1].trim();

  const dateMatch = fm.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})['"]?/m);
  if (dateMatch) result.date = dateMatch[1];

  const authorMatch = fm.match(/^author:\s*['"]?([^'"\r\n]+)['"]?/m);
  if (authorMatch) result.author = authorMatch[1].trim();

  return result;
}

/**
 * 从正文内容提取第一个 H1 标题作为 fallback
 */
function extractH1(content) {
  const match = content.match(/^#\s+(.+)\r?\n/m);
  return match ? match[1].trim() : null;
}

/**
 * 格式化日期字符串
 * "2026-05-10" → "2026年05月10日"
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${m}月${d}日`;
}

// ============================================================
// 扫描文章
// ============================================================

/**
 * 扫描 docs/news/ 下所有 mdx 文件，提取元信息并按日期排序
 */
function scanArticles() {
  const newsDir = path.join(ROOT_DIR, 'docs/news');
  if (!fs.existsSync(newsDir)) return [];

  const files = fs.readdirSync(newsDir)
    .filter(f => f.endsWith('.mdx') && f !== 'index.mdx');

  const articles = files.map(fileName => {
    const filePath = path.join(newsDir, fileName);
    const content = fs.readFileSync(filePath, 'utf-8');
    const fm = parseFrontmatter(content) || {};
    const linkPath = `/news/${fileName.replace('.mdx', '')}`;

    // title: frontmatter > H1 > 文件名
    const title = fm.title || extractH1(content) || fileName.replace('.mdx', '');

    // date: frontmatter > 文件名中的日期
    let date = fm.date || '';
    if (!date) {
      const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) date = dateMatch[1];
    }

    return {
      fileName,
      linkPath,
      title,
      date,
      dateFormatted: formatDate(date),
      author: fm.author || '',
    };
  });

  // 按日期倒序，同日按文件名正序
  articles.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.fileName.localeCompare(b.fileName);
  });

  return articles;
}

// ============================================================
// 生成 index.mdx
// ============================================================

function generateIndex(articles) {
  const indexPath = path.join(ROOT_DIR, 'docs/news/index.mdx');

  const lines = [
    '# 行业资讯',
    '',
    '手机行业最新动态、市场趋势和技术发展资讯。',
    '',
    '## 最新简报',
    '',
  ];

  if (articles.length === 0) {
    lines.push('暂无文章。');
  } else {
    for (const article of articles) {
      lines.push(`- [${article.title}](${article.linkPath}) - ${article.dateFormatted}`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*行业资讯由系统定期采集更新*');

  const newContent = lines.join('\n') + '\n';
  const oldContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf-8') : '';

  if (newContent === oldContent) return false; // 无变化

  fs.writeFileSync(indexPath, newContent, 'utf-8');
  return true;
}

// ============================================================
// 生成 sidebar（rspress.config.ts）
// ============================================================

function generateSidebar(articles) {
  const configPath = path.join(ROOT_DIR, 'rspress.config.ts');
  if (!fs.existsSync(configPath)) return false;

  let content = fs.readFileSync(configPath, 'utf-8');

  // 生成新的 sidebar items
  const newItems = articles.map(a =>
    `            { text: '${a.title.replace(/'/g, "\\'")}', link: '${a.linkPath}' }`
  ).join(',\n');

  // 用正则精确匹配 sidebar key，避免误匹配注释或其他字符串
  const newsSectionMatch = content.match(/'\/news\/':\s*\[/);
  const changelogSectionMatch = content.match(/'\/changelog\/':\s*\[/);
  if (!newsSectionMatch || !changelogSectionMatch) {
    console.log('  未找到 news/changelog sidebar 区域，跳过');
    return false;
  }

  const newsSectionIdx = newsSectionMatch.index;
  const changelogSectionIdx = changelogSectionMatch.index;

  const sectionSlice = content.slice(newsSectionIdx, changelogSectionIdx);

  // 找到 items: [ 的位置
  const itemsStartIdx = sectionSlice.indexOf('items: [');
  if (itemsStartIdx === -1) {
    console.log('  未找到 items: [，跳过');
    return false;
  }

  // 从 [ 之后开始，找到与之匹配的 ]
  const openBracket = sectionSlice.indexOf('[', itemsStartIdx);
  let depth = 1;
  let i = openBracket + 1;
  while (i < sectionSlice.length && depth > 0) {
    if (sectionSlice[i] === '[') depth++;
    else if (sectionSlice[i] === ']') depth--;
    i++;
  }
  if (depth !== 0) {
    console.log('  items 数组解析失败，跳过');
    return false;
  }

  // items: [   ← itemsStartIdx
  // ...content...   ← openBracket + 1 到 i - 1 (旧内容，不含 ])
  // ]   ← i - 1 是 ] 的位置

  // 替换: items: [ 之后到 ] 之前的内容
  const absItemsOpen = newsSectionIdx + openBracket + 1; // 第一个 [ 之后的绝对位置
  const absItemsClose = newsSectionIdx + i - 1;        // 最后一个 ] 的绝对位置

  const newBlock = newItems ? '\n' + newItems + ',\n          ' : '';
  const newContent = content.slice(0, absItemsOpen) + newBlock + content.slice(absItemsClose);

  if (newContent === content) return false; // 无变化

  fs.writeFileSync(configPath, newContent, 'utf-8');
  return true;
}

// ============================================================
// git push
// ============================================================

function gitPush() {
  try {
    console.log('正在提交到 GitHub...');
    execSync('git add -A', { cwd: ROOT_DIR, stdio: 'inherit' });
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR }).toString();
    if (status.trim()) {
      execSync(`git commit -m "chore: 更新行业资讯索引 ${new Date().toLocaleString('zh-CN')}"`, {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });
      execSync('git push', { cwd: ROOT_DIR, stdio: 'inherit' });
      console.log('推送成功!');
    } else {
      console.log('没有变更，无需提交');
    }
  } catch (error) {
    console.error('Git 操作失败:', error.message);
  }
}

// ============================================================
// main
// ============================================================

function main() {
  console.log('='.repeat(50));
  console.log('开始扫描行业资讯...', new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(50));

  const articles = scanArticles();
  console.log(`共扫描到 ${articles.length} 篇文章`);

  if (articles.length === 0) {
    console.log('没有文章，退出');
    return;
  }

  // 打印前 5 篇
  articles.slice(0, 5).forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.dateFormatted}] ${a.title}`);
  });
  if (articles.length > 5) {
    console.log(`  ... 还有 ${articles.length - 5} 篇`);
  }

  console.log('\n更新 index.mdx...');
  const indexChanged = generateIndex(articles);
  console.log(indexChanged ? '  index.mdx 已更新' : '  index.mdx 无变化');

  console.log('更新 sidebar...');
  const sidebarChanged = generateSidebar(articles);
  console.log(sidebarChanged ? '  sidebar 已更新' : '  sidebar 无变化');

  if (indexChanged || sidebarChanged) {
    gitPush();
  } else {
    console.log('无变更，无需推送');
  }

  console.log('='.repeat(50));
  console.log('更新完成!', new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(50));
}

main();
