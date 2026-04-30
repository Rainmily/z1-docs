# 手机行业资讯自动更新

本项目使用 GitHub Actions 每小时自动更新手机行业资讯。

## 设置步骤

### 1. 获取 Exa API Key

1. 访问 [Exa API](https://exa.ai) 注册账号
2. 获取免费 API Key（有免费额度）
3. 在 GitHub 仓库设置 secrets：
   - 进入仓库 **Settings** → **Secrets and variables** → **Actions**
   - 添加 `EXA_API_KEY` 并填入你的 API Key

### 2. 启用 Actions

在 GitHub 仓库的 **Actions** 页面确认 workflow 已启用。

### 3. 手动触发

可以在 GitHub Actions 页面手动点击 "Run workflow" 立即触发。

## 本地测试

```bash
npm install
EXA_API_KEY=your_api_key npm run update-news
```

## 工作原理

1. GitHub Actions 每小时自动触发
2. 使用 Exa API 搜索手机行业最新资讯
3. 生成 Markdown 格式的行业资讯报告
4. 自动更新资源中心索引
5. 提交到仓库
