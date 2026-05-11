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

// 从新闻标题中提取关键信息生成总结标题
function generateSummaryTitle(news) {
  const brands = ['华为', '小米', '苹果', 'iPhone', 'OPPO', 'vivo', '荣耀', '一加', '三星', '高通', '联发科', '紫光'];
  const actions = ['发布', '上市', '开售', '涨价', '突破', '合作', '达成', '推出'];
  const topics = ['旗舰', 'AI', '芯片', '折叠屏', '影像', '屏幕', '电池', '技术'];

  // 统计出现频率
  const brandCount = {};
  const topicCount = {};

  news.slice(0, 10).forEach(item => {
    brands.forEach(b => {
      if (item.title.includes(b)) {
        brandCount[b] = (brandCount[b] || 0) + 1;
      }
    });
    topics.forEach(t => {
      if (item.title.includes(t)) {
        topicCount[t] = (topicCount[t] || 0) + 1;
      }
    });
  });

  // 获取最高频的品牌和主题
  const topBrand = Object.entries(brandCount).sort((a, b) => b[1] - a[1])[0];
  const topTopic = Object.entries(topicCount).sort((a, b) => b[1] - a[1])[0];

  // 获取最新日期
  const latestDate = news[0]?.pubDate ? new Date(news[0].pubDate) : new Date();
  const dateStr = `${latestDate.getMonth() + 1}月${latestDate.getDate()}日`;

  // 生成标题
  let title = '';
  if (topBrand && topBrand[1] >= 2) {
    title = `${topBrand[0]}动态速递（${dateStr}）`;
  } else if (topTopic && topTopic[1] >= 2) {
    title = `${topTopic[0]}技术前沿（${dateStr}）`;
  } else {
    title = `手机行业日报（${dateStr}）`;
  }

  return title;
}

function generateMarkdown(news, dateStr) {
  // dateStr 格式: "YYYY-MM-DD HH:MM" 或 "YYYY-MM-DD"
  const [datePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split('-');
  const todayFormatted = `${year}年${month}月${day}日`;

  // 生成总结标题
  const summaryTitle = generateSummaryTitle(news);

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

  let markdown = `# ${summaryTitle}

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

  // 生成总结
  const summary = [];
  if (sections['新品发布'].length > 0) {
    summary.push(`${sections['新品发布'].length}款新机发布`);
  }
  if (sections['技术趋势'].length > 0) {
    summary.push(`${sections['技术趋势'].length}项技术突破`);
  }
  if (sections['市场分析'].length > 0) {
    summary.push(`${sections['市场分析'].length}条市场动态`);
  }
  if (sections['行业动态'].length > 0) {
    summary.push(`${sections['行业动态'].length}条行业资讯`);
  }

  markdown += `## 总结\n\n`;
  markdown += `**${todayFormatted}** 手机行业核心态势：\n\n`;
  summary.forEach((s, idx) => {
    markdown += `${idx + 1}. **${s}**\n`;
  });
  markdown += `\n---\n\n`;
  markdown += `*本报告基于公开信息整理，由定时任务自动生成 | ${new Date().toLocaleString('zh-CN')}*\n`;

  return { markdown, summaryTitle };
}

// 更新 docs/news/index.mdx 的文章列表
function updateNewsIndex(newsFilePath, summaryTitle) {
  const indexPath = path.join(ROOT_DIR, 'docs/news/index.mdx');
  if (!fs.existsSync(indexPath)) return;

  const dateMatch = newsFilePath.match(/(\d{4}-\d{2}-\d{2})/);
  const dateStr = dateMatch ? `${dateMatch[1].split('-')[0]}年${dateMatch[1].split('-')[1]}月${dateMatch[1].split('-')[2]}日` : '';
  const linkPath = `/news/${newsFilePath.replace('.mdx', '')}`;
  // 按日期前缀去重，同一天多次运行只保留第一篇
  const datePrefix = dateMatch ? dateMatch[1] : '';

  let content = fs.readFileSync(indexPath, 'utf-8');

  // 生成新的链接行，使用总结标题
  const newLink = `- [${summaryTitle}](${linkPath}) - ${dateStr}`;

  // 检查同一天是否已有文章（同一天只保留第一篇，避免重复）
  if (datePrefix && content.includes(datePrefix)) {
    console.log(`  ${summaryTitle} 当日已有文章，跳过更新索引`);
    return;
  }

  // 在 "## 最新简报" 后面插入新链接
  const regex = /(## 最新简报\n\n)(- \[)/;
  if (regex.test(content)) {
    content = content.replace(regex, `$1${newLink}\n$2`);
    fs.writeFileSync(indexPath, content);
    console.log(`  索引已更新: ${summaryTitle}`);
  }
}

// 更新 rspress.config.ts 的 sidebar 配置
function updateSidebar(newsFilePath, summaryTitle) {
  const configPath = path.join(ROOT_DIR, 'rspress.config.ts');
  if (!fs.existsSync(configPath)) return;

  const linkPath = `/news/${newsFilePath.replace('.mdx', '')}`;
  // 按日期前缀去重，同一天多次运行只保留第一篇
  const dateMatch = newsFilePath.match(/(\d{4}-\d{2}-\d{2})/);
  const datePrefix = dateMatch ? dateMatch[1] : '';

  let content = fs.readFileSync(configPath, 'utf-8');

  // 检查同一天是否已有 sidebar 条目
  if (datePrefix && content.includes(datePrefix)) {
    console.log(`  ${summaryTitle} 当日已有 sidebar 条目，跳过更新`);
    return;
  }

  // 生成新的 sidebar 条目
  const newItem = `{ text: '${summaryTitle}', link: '${linkPath}' }`;

  // 限定在 news sidebar 区域内查找 marker（避免匹配到其他 sidebar 的同名项）
  const newsSectionStart = content.indexOf("'/news/':");
  const newsSectionEnd = content.indexOf("'/changelog/':");
  const newsSection = content.slice(newsSectionStart, newsSectionEnd);

  const marker = `{ text: '行业资讯', link: '/news/' }`;
  const markerIdx = newsSection.indexOf(marker);
  if (markerIdx === -1) {
    console.log(`  未找到 sidebar marker '${marker}'，跳过`);
    return;
  }
  // 找到 marker 所在行的结束（该行以 },\n 结尾）
  const markerLineEnd = newsSection.indexOf('},\n', markerIdx);
  if (markerLineEnd === -1) {
    console.log(`  未找到 sidebar marker 结束符，跳过`);
    return;
  }
  // 插入到 marker 行结束之后
  const absoluteMarkerIdx = newsSectionStart + markerIdx;
  const absoluteInsertIdx = newsSectionStart + markerLineEnd + 2;
  content = content.slice(0, absoluteInsertIdx) + `            ${newItem},\n` + content.slice(absoluteInsertIdx);
  fs.writeFileSync(configPath, content);
  console.log(`  Sidebar 已更新: ${summaryTitle}`);
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
  // 文件名精确到小时分钟，每小时生成一篇独立的文章
  const pad = n => String(n).padStart(2, '0');
  const datePrefix = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const hourMin = `${pad(today.getHours())}${pad(today.getMinutes())}`; // HHmm
  const dateStr = `${datePrefix} ${pad(today.getHours())}:${pad(today.getMinutes())}`;
  const newsDir = path.join(ROOT_DIR, 'docs/news');

  if (!fs.existsSync(newsDir)) {
    fs.mkdirSync(newsDir, { recursive: true });
  }

  const news = await searchNews();

  if (news.length === 0) {
    console.error('未获取到资讯，退出');
    process.exit(1);
  }

  const { markdown, summaryTitle } = generateMarkdown(news, dateStr);
  const fileName = `${datePrefix}-${hourMin}-industry-news.mdx`;
  const filePath = path.join(newsDir, fileName);
  fs.writeFileSync(filePath, markdown);
  console.log(`文章已保存: ${filePath}`);
  console.log(`文章标题: ${summaryTitle}`);

  // 更新索引和 sidebar
  console.log('更新配置文件...');
  updateNewsIndex(fileName, summaryTitle);
  updateSidebar(fileName, summaryTitle);

  gitPush();

  console.log('='.repeat(50));
  console.log('更新完成!', new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(50));
}

main().catch(console.error);
