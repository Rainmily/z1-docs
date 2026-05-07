# GitHub Actions 部署配置指南

本文档说明如何在 GitHub 仓库中配置 Secrets，使 Actions 能正确部署到服务器。

---

## 需要的 Secrets

在 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** 中添加以下 Secrets：

### 1. 服务器连接配置

| Secret 名称 | 值 | 说明 |
|------------|------|------|
| `SERVER_HOST` | `106.54.198.58` | 服务器 IP 地址 |
| `SERVER_PORT` | `22` | SSH 端口（默认 22） |
| `SERVER_USER` | `root` | SSH 用户名 |
| `SERVER_SSH_KEY` | SSH 私钥全文 | 复制 claw.pem 的内容 |

> **如何获取 `SERVER_SSH_KEY`？**
> 在本地执行：
> ```powershell
> type "C:\Users\Administrator\Documents\WXWork\1688855782268707\Cache\File\2026-04\claw.pem"
> ```
> 复制全部内容（包括 `-----BEGIN...` 和 `-----END...`），粘贴到 GitHub Secret 值中。

### 2. 企业微信认证配置

| Secret 名称 | 值 |
|------------|------|
| `MULTI_WECOM_CONFIG` | JSON 数组（每个企业的凭证） |
| `SESSION_SECRET` | 随机字符串（32位以上） |

#### MULTI_WECOM_CONFIG 格式（单行 JSON）

```json
[
  {
    "id": "zsqk",
    "name": "掌上乾坤",
    "logo": "",
    "corpId": "ww你的企业ID",
    "agentId": "1000001",
    "agentSecret": "你的应用Secret",
    "allowedUsers": ""
  }
]
```

> **重要**：粘贴到 GitHub Secret 时，整个 JSON 必须写成**一行**，不能用多行格式。

#### SESSION_SECRET 生成

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 配置步骤

```
GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret
```

添加以下 6 个 Secret：

```
SERVER_HOST          → 106.54.198.58
SERVER_PORT          → 22
SERVER_USER          → root
SERVER_SSH_KEY       → （claw.pem 文件内容）
MULTI_WECOM_CONFIG   → [{"id":"zsqk",...}]
SESSION_SECRET       → （随机字符串）
```

---

## 部署流程

每次 `git push` 到 `master` 分支自动触发：

1. ✅ 构建 Rspress 静态站点
2. ✅ 打包上传到服务器
3. ✅ 解压前端 → `/www/wwwroot/z1-docs/doc_build/`
4. ✅ 解压后端 → `/www/wwwroot/z1-docs/server/`
5. ✅ 从 Secrets 创建 `.env` 文件
6. ✅ `npm install --production` 安装后端依赖
7. ✅ `pm2 restart` 重启认证服务（端口 3001）
8. ✅ 更新 Nginx 添加 `/auth-api/` 反向代理
9. ✅ `nginx -s reload` 重载 Nginx
10. ✅ 健康检查确认服务正常

---

## 触发部署

```bash
git add .
git commit -m "feat: 企业微信登录"
git push origin master
```

或 GitHub → **Actions** → **Deploy Docs + Auth Server** → **Run workflow**
