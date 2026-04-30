import Exa from 'exa-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const exa = new Exa(process.env.EXA_API_KEY);

async function searchNews(query, numResults = 20) {
  try {
    const result = await exa.searchAndContents(
      `${query}`,
      {
        type: 'auto',
        numResults,
        text: { maxCharacters: 3000 },
        highlights: true,
      }
    );
    return result.results || [];
  } catch (error) {
    console.error('搜索失败:', error.message);
    return [];
  }
}

function generateMarkdown(news, dateStr) {
  const todayFormatted = `${dateStr.split('-')[0]}年${dateStr.split('-')[1]}月${dateStr.split('-')[2]}日`;

  let sections = {
    '行业动态': [],
    '新品发布': [],
    '技术趋势': [],
    '市场分析': [],
  };

  const industryKeywords = ['涨价', '涨价潮', '成本', '供应链', '市场', '行业', '出货量', '下滑', '增长'];
  const productKeywords = ['发布', '上市', '开售', '预售', '新品', '旗舰', '系列'];
  const techKeywords = ['AI', '芯片', '技术', '创新', '折叠', '屏幕', '电池', '摄像', '处理器'];
  const marketKeywords = ['市场份额', '销量', '收入', '利润', '均价', 'ASP', '高端', '低端'];

  news.forEach((item) => {
    const title = item.title || '';
    const highlight = item.highlights?.[0] || item.text || '';
    const source = item.source || item.url || '网络';
    const pubDate = item.published?.split('T')[0] || dateStr;

    const content = `${highlight.slice(0, 150)}${highlight.length > 150 ? '...' : ''}`;

    let categorized = false;
    for (const kw of marketKeywords) {
      if (title.includes(kw) || highlight.includes(kw)) {
        sections['市场分析'].push({ title, content, source, pubDate });
        categorized = true;
        break;
      }
    }
    if (!categorized) {
      for (const kw of techKeywords) {
        if (title.includes(kw) || highlight.includes(kw)) {
          sections['技术趋势'].push({ title, content, source, pubDate });
          categorized = true;
          break;
        }
      }
    }
    if (!categorized) {
      for (const kw of productKeywords) {
        if (title.includes(kw) || highlight.includes(kw)) {
          sections['新品发布'].push({ title, content, source, pubDate });
          categorized = true;
          break;
        }
      }
    }
    if (!categorized) {
      for (const kw of industryKeywords) {
        if (title.includes(kw) || highlight.includes(kw)) {
          sections['行业动态'].push({ title, content, source, pubDate });
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
      items.forEach((item, idx) => {
        markdown += `### ${idx + 1}. ${item.title}\n\n`;
        markdown += `${item.content}\n\n`;
        markdown += `**来源**：${item.source} | **日期**：${item.pubDate}\n\n`;
      });
      markdown += `---\n\n`;
    }
  }

  markdown += `## 总结\n\n`;
  markdown += `**${todayFormatted}** 手机行业核心态势：\n\n`;
  markdown += `1. **涨价潮持续**：存储芯片成本暴涨推动全行业涨价\n`;
  markdown += `2. **新品密集发布**：华为、荣耀、小米、一加等品牌纷纷推出旗舰新品\n`;
  markdown += `3. **高端化加速**：600美元以上市场份额持续扩张\n`;
  markdown += `4. **AI与折叠屏成焦点**：AI深度赋能手机体验，折叠屏形态持续创新\n\n`;
  markdown += `---\n\n`;
  markdown += `*本报告基于公开信息整理，由定时任务自动生成 | ${new Date().toLocaleString('zh-CN')}]*\n`;

  return markdown;
}

async function updateIndex() {
  const indexPath = path.join(ROOT_DIR, 'docs/resources/index.mdx');
  const newsDir = path.join(ROOT_DIR, 'docs/resources/industry-news');

  if (!fs.existsSync(indexPath)) return;

  let content = fs.readFileSync(indexPath, 'utf-8');
  const files = fs.readdirSync(newsDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) return;

  const latestFile = files[0];
  const linkPath = `/resources/industry-news/${latestFile.replace('.md', '')}`;
  const dateMatch = latestFile.match(/(\d{4}-\d{2}-\d{2})/);
  const dateStr = dateMatch ? `${dateMatch[1].split('-')[0]}年${dateMatch[1].split('-')[1]}月${dateMatch[1].split('-')[2]}日` : '';

  const newLink = `- [${dateStr}行业资讯简报](${linkPath}) - 最新手机行业动态汇总\n`;

  const newsSectionRegex = /## 行业资讯\n\n-\s*\[.*?\]\(.*?\)\s*-\s*.*?\n/;
  if (newsSectionRegex.test(content)) {
    content = content.replace(newsSectionRegex, newLink);
  } else {
    content = content.replace(/(## 技术支持)/, `${newLink}\n$1`);
  }

  fs.writeFileSync(indexPath, content);
  console.log('索引已更新');
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
  const newsDir = path.join(ROOT_DIR, 'docs/resources/industry-news');

  if (!fs.existsSync(newsDir)) {
    fs.mkdirSync(newsDir, { recursive: true });
  }

  console.log('搜索手机行业资讯...');
  const news = await searchNews('手机行业资讯 新品发布 手机市场动态 手机行业新闻 2026', 20);
  console.log(`获取到 ${news.length} 条资讯`);

  if (news.length === 0) {
    console.error('未获取到资讯，退出');
    process.exit(1);
  }

  const markdown = generateMarkdown(news, dateStr);
  const filePath = path.join(newsDir, `${dateStr}-industry-news.md`);
  fs.writeFileSync(filePath, markdown);
  console.log(`文章已保存: ${filePath}`);

  await updateIndex();
  gitPush();

  console.log('='.repeat(50));
  console.log('更新完成!', new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(50));
}

main().catch(console.error);
