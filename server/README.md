# 掌上乾坤文档站 - 多企业微信登录集成指南

## 功能特性

- ✅ **多企业支持**：支持从多个不同的企业微信组织登录
- ✅ **独立凭证**：每个企业有独立的 CorpID + AgentID + Secret
- ✅ **按企业限制成员**：可设置每个企业只允许特定成员访问
- ✅ **自动降级**：如果只配置一个企业，自动隐藏企业选择页
- ✅ **PC 扫码 + 移动端授权**：全平台覆盖

---

## 快速开始

### 1. 安装依赖并启动

```bash
cd server
npm install
cp .env.example .env
# 编辑 .env 填入企业微信凭证
npm run dev
```

### 2. 配置企业微信应用

每个需要接入的企业，都需要在企业微信管理后台创建一个自建应用：

```
企业A:
  Corp ID:     ww1234567890abcd
  Agent ID:    1000001
  Agent Secret: xxxxxxxxxxxxxxxxxxxxxxxx

企业B:
  Corp ID:     ww9876543210dcba
  Agent ID:    1000002
  Agent Secret: yyyyyyyyyyyyyyyyyyyyyyyy
```

### 3. 配置 .env

```bash
# .env 文件
MULTI_WECOM_CONFIG='[
  {
    "id": "zsqk",
    "name": "掌上乾坤",
    "corpId": "ww1234567890abcd",
    "agentId": "1000001",
    "agentSecret": "xxxxxxxxxxxxxxxx",
    "allowedUsers": ""
  },
  {
    "id": "partner-a",
    "name": "合作伙伴A公司",
    "corpId": "ww9876543210dcba",
    "agentId": "1000002",
    "agentSecret": "yyyyyyyyyyyyyyyy",
    "allowedUsers": "zhangsan,lisi"   # 空=允许所有成员
  }
]'
```

### 4. 每个企业都需要配置

在**各自的企业微信管理后台**完成以下配置：

| 配置项 | 路径 |
|--------|------|
| OAuth 可信域名 | 应用详情 → 企业微信授权登录 |
| 网页授权回调域名 | 应用设置 → 网页授权及 JS-SDK |
| 应用可见范围 | 应用详情 → 可用范围（设置谁可以登录）|

---

## 工作原理

### 登录流程

```
用户访问受保护页面
       │
       ▼
  前端调用 /auth/companies 获取企业列表
       │
       ▼
  ┌──────────────────────────────┐
  │  1个企业？ → 直接显示登录按钮  │
  │  多个企业？→ 显示企业选择列表  │
  └──────────────────────────────┘
       │
       ▼
  用户选择企业A
       │
       ▼
  前端调用 /auth/qr-url?companyId=partner-a
       │
       ▼
  后端用企业A的 CorpID 生成扫码链接
       │
       ▼
  用户用企业A的企业微信 App 扫码
       │
       ▼
  企业微信回调 /auth/callback
  （state 中包含 companyId）
       │
       ▼
  后端用企业A的凭证完成登录验证
       │
       ▼
  写入 Session → 重定向前端 → 登录成功
```

### State 格式（防 CSRF）

```json
{
  "companyId": "partner-a",
  "type": "qr",
  "random": "abc123def456"
}
```

Base64 编码后作为 state 参数传递，确保回调时能识别来自哪个企业。

---

## 核心接口

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/auth/companies` | GET | - | 获取企业列表和模式 |
| `/auth/qr-url` | GET | `companyId` | 获取 PC 扫码链接 |
| `/auth/oauth-url` | GET | `companyId` | 获取移动端授权链接 |
| `/auth/callback` | GET | `code`, `state` | 企业微信回调 |
| `/auth/status` | GET | - | 查询登录状态 |
| `/auth/logout` | POST | - | 退出登录 |
| `/auth/verify` | POST | `token` | 验证 Token |

---

## 单企业 vs 多企业

系统自动检测配置：

```js
// 1 个企业配置 → 单企业模式（隐藏企业选择页）
// 2+ 个企业配置 → 多企业模式（显示企业选择列表）
```

---

## 成员访问控制

### 方式一：企业微信应用可见范围（推荐）

在企业微信管理后台 → 应用详情 → **可用范围**中设置。
最简单，无需额外配置。

### 方式二：配置 allowedUsers

在 `.env` 中精确指定允许的成员 userid：

```json
{
  "id": "partner-a",
  "name": "合作伙伴A",
  "allowedUsers": "zhangsan,lisi,wangwu"
}
```

> userid 可在企业微信通讯录中查看

两种方式可以同时使用，互不影响。

---

## 生产部署

### Nginx 反向代理配置

```nginx
server {
    listen 443 ssl;
    server_name docs.whohi.cn;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 静态站点
    location / {
        root /var/www/z1-docs/doc_build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到后端
    location /auth-api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cookie_path / "/; SameSite=Lax; Secure";
    }
}
```

### PM2 启动后端

```bash
pm2 start src/index.js --name docs-auth
pm2 save
pm2 startup
```

### 环境变量（生产）

```bash
PORT=3001
FRONTEND_URL=https://docs.whohi.cn
SERVER_URL=https://docs.whohi.cn/auth-api
SESSION_SECRET=<生产随机密钥>
NODE_ENV=production
MULTI_WECOM_CONFIG='[...]'
```

---

## 目录结构

```
server/
├── .env                        # 企业微信凭证（勿提交 Git）
├── .env.example               # 配置模板
├── package.json
└── src/
    ├── index.js               # 服务入口
    ├── routes/auth.js         # 认证路由（支持多企业）
    └── utils/wecom.js         # 企业微信 API（多企业凭证）
```
