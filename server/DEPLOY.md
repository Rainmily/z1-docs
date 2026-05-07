# 服务器部署指南 - 掌上乾坤文档站 · 企业微信登录

## 前提条件

- 文档站已构建：`npm run build`（本地执行）
- 文档站构建产物位于 `doc_build/` 目录
- 服务器已安装 Node.js v20+（已确认 ✅）

---

## 第一步：在本地构建并打包

```bash
# 在 Windows 本地（D:\www\z1-docs\）
npm run build
```

构建完成后，`doc_build/` 目录即为部署产物。

---

## 第二步：上传到服务器

### 方式一：通过 scp 命令上传（推荐）

```bash
# 在 Windows PowerShell 或 Git Bash 中执行
scp -i "C:\Users\Administrator\Documents\WXWork\1688855782268707\Cache\File\2026-04\claw.pem" -r D:\www\z1-docs\doc_build\* root@106.54.198.58:/www/wwwroot/z1-docs/
```

### 方式二：通过 Git 同步

在服务器上：
```bash
cd /www/wwwroot/z1-docs
git pull origin master
```

---

## 第三步：部署认证服务

### 3.1 安装认证服务依赖

```bash
# 在服务器上执行
cd /www/wwwroot/z1-docs/server
npm install --production
```

### 3.2 创建 .env 配置文件

```bash
# 创建配置文件（在服务器上执行）
cat > /www/wwwroot/z1-docs/server/.env << 'EOF'
# 企业微信应用凭证
WECOM_CORP_ID=wwxxxxxxxxxxxxx
WECOM_AGENT_ID=1000001
WECOM_AGENT_SECRET=your-agent-secret-here

# 服务配置
PORT=3001
FRONTEND_URL=https://docs.whohi.cn
SERVER_URL=https://docs.whohi.cn/auth-api
SESSION_SECRET=change-this-to-random-string-abc123

# 允许访问的成员（留空允许所有成员）
# 格式：userid1,userid2,userid3
ALLOWED_USERS=
EOF
```

### 3.3 使用 PM2 启动认证服务

```bash
# 安装 PM2（如果还没有）
npm install -g pm2

# 启动认证服务
cd /www/wwwroot/z1-docs/server
pm2 start src/index.js --name z1-docs-auth

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 list
pm2 logs z1-docs-auth
```

---

## 第四步：更新 Nginx 配置

### 4.1 备份现有配置

```bash
cp /www/server/panel/vhost/nginx/docs.whohi.cn.ssl.conf /www/wwwlogs/docs.whohi.cn.ssl.conf.bak
```

### 4.2 写入新的 Nginx 配置

```bash
cat > /www/server/panel/vhost/nginx/docs.whohi.cn.ssl.conf << 'EOF'
server {
    listen 80;
    server_name docs.whohi.cn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name docs.whohi.cn;

    ssl_certificate /www/server/nginx/conf/ssl/docs.whohi.cn.pem;
    ssl_certificate_key /www/server/nginx/conf/ssl/docs.whohi.cn.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    root /www/wwwroot/z1-docs;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # ── 企业微信认证 API 代理 ────────────────────────────────
    location /auth-api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
        proxy_intercept_errors off;
        proxy_buffering off;
    }
    # ── 静态资源缓存 ────────────────────────────────────────
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control 'public, immutable';
    }
    # ── 页面路由 fallback（SPA）──────────────────────────────
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

### 4.3 重载 Nginx 配置

```bash
/www/server/nginx/sbin/nginx -t
/www/server/nginx/sbin/nginx -s reload
```

如果失败，回滚：
```bash
cp /www/wwwlogs/docs.whohi.cn.ssl.conf.bak /www/server/panel/vhost/nginx/docs.whohi.cn.ssl.conf
/www/server/nginx/sbin/nginx -s reload
```

---

## 第五步：企业微信后台配置

在企业微信管理后台完成以下配置：

### 5.1 配置可信域名

进入 **应用管理 → 你的应用 → 企业微信授权登录**

在「OAuth 可信域名」中添加：
```
docs.whohi.cn
```

### 5.2 配置应用可见范围

进入 **应用管理 → 你的应用 → 可用范围**

设置为需要访问文档的成员/部门。

### 5.3 获取凭证

在应用详情页获取：
- **AgentId**：应用 ID
- **Secret**：应用密钥（在「凭证与基础信息」中查看，点击启用后获取）

在 **我的企业 → 企业信息** 中获取：
- **CorpID**：企业 ID

---

## 验证部署

### 启动顺序检查

```bash
# 1. 确认认证服务运行中
pm2 list
# 应显示 z1-docs-auth 状态为 online

# 2. 确认端口监听
ss -tlnp | grep -E '3001|443'
# 应显示 3001（Node）和 443（Nginx）

# 3. 测试认证 API
curl https://docs.whohi.cn/auth-api/auth/status
# 应返回 {"loggedIn": false}

# 4. 访问文档站
curl -I https://docs.whohi.cn/
# 应返回 200 OK
```

### 浏览器测试

1. 访问 `https://docs.whohi.cn/z1/`（受保护页面）
2. 应显示企业微信登录页面
3. 使用企业微信扫码登录

---

## 常见问题排查

### 问题1：扫码后提示"redirect_uri 参数错误"

**原因**：企业微信后台的可信域名与回调地址不一致

**排查**：
```bash
# 查看 Nginx 配置中的 SERVER_URL
cat /www/wwwroot/z1-docs/server/.env | grep SERVER_URL
```

确保 `.env` 中 `SERVER_URL` 为 `https://docs.whohi.cn/auth-api`，且企业微信后台可信域名配置为 `docs.whohi.cn`。

### 问题2：登录页显示，但扫码无反应

**排查**：
```bash
# 1. 检查认证服务是否运行
pm2 logs z1-docs-auth

# 2. 检查企业微信凭证
cat /www/wwwroot/z1-docs/server/.env | grep WECOM
```

### 问题3：登录成功后页面空白

**排查**：
```bash
# 检查浏览器控制台是否有跨域错误
# 确认 Nginx 的 proxy_pass 配置正确
```

### 问题4：重启服务器后服务未启动

```bash
# 重新保存 PM2 进程
pm2 save
# 或设置开机自启脚本
pm2 startup
```
