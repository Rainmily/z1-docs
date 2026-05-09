import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import https from 'https';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// RSS 订阅源
const RSS_SOURCES = [
  { name: 'IT之家', url: 'https://www.ithome.com/rss/' },
  { name: '36氪', url: 'https://36kr.com/feed' },
  { name: '虎嗅', url: 'https://www.huxiu.com/rss/0.xml' },
];

// 关键词过滤
const PHONE_KEYWORDS = ['手机', '华为', '小米', '苹果', 'OPPO', 'vivo', '荣耀', '一加', 'iPhone', 'Android', '芯片', '折叠屏', '5G', 'AI手机'];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchRSS(source) {
  try {
    console.log(`  - 获取 ${source.name}...`);
    const xml = await fetchUrl(source.url);
    const dom = new JSDOM(xml, { contentType: 'application/xml' });
    const doc = dom.window.document;
    const items = doc.querySelectorAll('item');

    return Array.from(items).map(item => ({
      title: item.querySelector('title')?.textContent?.trim() || '',
      link: item.querySelector('link')?.textContent?.trim() || '',
      description: item.querySelector('description')?.textContent?.trim() || item.querySelector('summary')?.textContent?.trim() || '',
      pubDate: item.querySelector('pubDate')?.textContent?.trim() || '',
      source: source.name,
    })).filter(item => item.title && PHONE_KEYWORDS.some(kw => item.title.includes(kw) || item.description.includes(kw)));
  } catch (error) {
    console.error(`  - ${source.name} 获取失败: ${error.message}`);
    return [];
  }
}

async function searchNews() {
  console.log('开始获取 RSS 资讯...');
  const allNews = [];

  for (const source of RSS_SOURCES) {
    const news = await fetchRSS(source);
    allNews.push(...news);
    await new Promise(r => setTimeout(r, 500)); // 避免请求过快
  }

  // 按日期排序
  allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`获取到 ${allNews.length} 条相关资讯`);
  return allNews.slice(0, 20);
}

function generateMarkdown(news, dateStr) {
  const todayFormatted = `${dateStr.split('-')[0]}年${dateStr.split('-')[1]}月${dateStr.split('-')[2]}日`;

  let sections = {
    '行业动态': [],
    '新品发布': [],
    '技术趋势': [],
    '市场分析': [],
  };

  const industryKeywords = ['涨价', '成本', '供应链', '市场', '行业', '出货量', '下滑', '增长', '销量', '份额'];
  const productKeywords = ['发布', '上市', '开售', '预售', '新品', '旗舰', '系列', '发布', '亮相'];
  const techKeywords = ['AI', '芯片', '技术', '创新', '折叠', '屏幕', '电池', '摄像', '处理器', '系统'];
  const marketKeywords = ['市场份额', '销量', '收入', '利润', '均价', '高端', '低端', '出货'];

  const getSummary = (desc) => {
    const text = desc.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim();
    return text.slice(0, 150) + (text.length > 150 ? '...' : '');
  };

  const getDate = (pubDate) => {
    try {
      return new Date(pubDate).toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  news.forEach((item) => {
    const title = item.title;
    const content = getSummary(item.description);
    const pubDate = getDate(item.pubDate);
    const source = item.source;

    let categorized = false;
    for (const kw of marketKeywords) {
      if (title.includes(kw)) {
        sections['市场分析'].push({ title, content, source, pubDate });
        categorized = true;
        break;
      }
    }
    if (!categorized) {
      for (const kw of techKeywords) {
        if (title.includes(kw)) {
          sections['技术趋势'].push({ title, content, source, pubDate });
          categorized = true;
          break;
        }
      }
    }
    if (!categorized) {
      for (const kw of productKeywords) {
        if (title.includes(kw)) {
          sections['新品发布'].push({ title, content, source, pubDate });
          categorized = true;
          break;
        }
      }
    }
    if (!categorized) {
      for (const kw of industryKeywords) {
        if (title.includes(kw)) {
          sections['行业动态'].push({ title, content, source, pubDate });
          categorized = true;
          break;
        }
      }
    }
    if (!categorized) {
      sections['行业动态'].push({ title, content, source, pubDate });
    }
  });

  let markdown = `# 手机行业资讯简报（${todayFormatted}）

本报告汇总最新手机行业动态，涵盖行业动态、新品发布、技术趋势与市场分析四大板块。

---

`;

  for (const [sectionName, items] of Object.entries(sections)) {
    if (items.length > 0) {
      markdown += `## ${sectionName}\n\n`;
      items.slice(0, 5).forEach((item, idx) => {
        markdown += `### ${idx + 1}. ${item.title}\n\n`;
        markdown += `${item.content}\n\n`;
        markdown += `**来源**：${item.source} | **日期**：${item.pubDate}\n\n`;
      });
      markdown += `---\n\n`;
    }
  }

  markdown += `## 总结\n\n`;
  markdown += `**${todayFormatted}** 手机行业核心态势：\n\n`;
  markdown += `1. **市场动态**：手机行业持续演进，各品牌竞争激烈\n`;
  markdown += `2. **新品密集**：各大厂商纷纷推出旗舰新品\n`;
  markdown += `3. **技术创新**：AI、芯片、折叠屏等技术持续突破\n`;
  markdown += `4. **行业趋势**：高端化与技术创新成为主旋律\n\n`;
  markdown += `---\n\n`;
  markdown += `*本报告基于公开信息整理，由定时任务自动生成 | ${new Date().toLocaleString('zh-CN')}*\n`;

  return markdown;
}

// 更新 docs/news/index.mdx 的文章列表
function updateNewsIndex(newsFilePath) {
  const indexPath = path.join(ROOT_DIR, 'docs/news/index.mdx');
  if (!fs.existsSync(indexPath)) return;

  const dateMatch = newsFilePath.match(/(\d{4}-\d{2}-\d{2})/);
  const dateStr = dateMatch ? `${dateMatch[1].split('-')[0]}年${dateMatch[1].split('-')[1]}月${dateMatch[1].split('-')[2]}日` : '';
  const linkPath = `/news/${newsFilePath.replace('.mdx', '')}`;
  const fileName = path.basename(newsFilePath, '.mdx');

  let content = fs.readFileSync(indexPath, 'utf-8');

  // 生成新的链接行
  const newLink = `- [${dateStr}行业资讯简报](${linkPath}) - 最新手机行业动态汇总`;

  // 检查是否已存在该链接
  if (content.includes(fileName)) {
    console.log(`  ${dateStr} 文章已存在，跳过更新索引`);
    return;
  }

  // 在 "## 最新简报" 后面插入新链接
  const regex = /(## 最新简报\n\n)(- \[)/;
  if (regex.test(content)) {
    content = content.replace(regex, `$1${newLink}\n$2`);
    fs.writeFileSync(indexPath, content);
    console.log(`  索引已更新: ${dateStr}`);
  }
}

// 更新 rspress.config.ts 的 sidebar 配置
function updateSidebar(newsFilePath) {
  const configPath = path.join(ROOT_DIR, 'rspress.config.ts');
  if (!fs.existsSync(configPath)) return;

  const dateMatch = newsFilePath.match(/(\d{4}-\d{2}-\d{2})/);
  const dateStr = dateMatch ? `${dateMatch[1].split('-')[0]}年${dateMatch[1].split('-')[1]}月${dateMatch[1].split('-')[2]}日` : '';
  const linkPath = `/news/${newsFilePath.replace('.mdx', '')}`;
  const fileName = path.basename(newsFilePath, '.mdx');

  let content = fs.readFileSync(configPath, 'utf-8');

  // 检查是否已存在该链接
  if (content.includes(fileName)) {
    console.log(`  ${dateStr} sidebar 已存在，跳过更新`);
    return;
  }

  // 生成新的 sidebar 条目
  const newItem = `{ text: '${dateStr}', link: '${linkPath}' }`;

  // 在 '/news/': 的 sidebar 配置中查找并插入
  // 匹配 '/news/' 的 sidebar 配置块
  const newsSidebarRegex = /(\/news\/': \[\s*\{[^}]*text: '行业资讯'[^}]*\n[^}]*items: \[)([^]]*)(\]\s*,)/;

  if (newsSidebarRegex.test(content)) {
    content = content.replace(newsSidebarRegex, (match, prefix, items, suffix) => {
      // 在 items 数组中添加新条目（插入在第一个位置之后）
      const newItems = `${newItem},\n            ${items.trim()}`;
      return `${prefix}\n            ${newItems}\n          ${suffix}`;
    });
    fs.writeFileSync(configPath, content);
    console.log(`  Sidebar 已更新: ${dateStr}`);
  } else {
    console.log(`  未找到 /news/ sidebar 配置，跳过`);
  }
}

function gitPush() {
  try {
    console.log('正在提交到 GitHub...');
    execSync('git add -A', { cwd: ROOT_DIR, stdio: 'inherit' });
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR }).toString();
    if (status.trim()) {
      execSync(`git commit -m "chore: 更新手机行业资讯 ${new Date().toLocaleString('zh-CN')}"`, {
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

async function main() {
  console.log('='.repeat(50));
  console.log('开始更新手机行业资讯...', new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(50));

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const newsDir = path.join(ROOT_DIR, 'docs/news');

  if (!fs.existsSync(newsDir)) {
    fs.mkdirSync(newsDir, { recursive: true });
  }

  const news = await searchNews();

  if (news.length === 0) {
    console.error('未获取到资讯，退出');
    process.exit(1);
  }

  const markdown = generateMarkdown(news, dateStr);
  const fileName = `${dateStr}-industry-news.mdx`;
  const filePath = path.join(newsDir, fileName);
  fs.writeFileSync(filePath, markdown);
  console.log(`文章已保存: ${filePath}`);

  // 更新索引和 sidebar
  console.log('更新配置文件...');
  updateNewsIndex(fileName);
  updateSidebar(fileName);

  gitPush();

  console.log('='.repeat(50));
  console.log('更新完成!', new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(50));
}

main().catch(console.error);
