#!/bin/bash
# ============================================================
# 掌上乾坤文档站 - 企业微信登录 · 一键部署脚本
# 在服务器上执行：bash setup.sh
# ============================================================

set -e

echo "=========================================="
echo " 掌上乾坤文档站 - 企业微信登录部署"
echo "=========================================="
echo ""

# ── 颜色定义 ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ── 检测是否以 root 运行 ───────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}请使用 root 权限运行此脚本（sudo bash setup.sh）${NC}"
  exit 1
fi

# ── 检查 .env 是否已配置 ───────────────────────────────────
if [ ! -f ".env" ]; then
  echo -e "${RED}错误：.env 文件不存在！${NC}"
  echo "请先创建 .env 文件，参考 .env.example"
  echo "至少需要填写：WECOM_CORP_ID、WECOM_AGENT_ID、WECOM_AGENT_SECRET"
  exit 1
fi

# 检查关键配置
CORP_ID=$(grep WECOM_CORP_ID .env | cut -d '=' -f2 | tr -d ' ')
AGENT_ID=$(grep WECOM_AGENT_ID .env | cut -d '=' -f2 | tr -d ' ')
AGENT_SECRET=$(grep WECOM_AGENT_SECRET .env | cut -d '=' -f2 | tr -d ' ')

if [ -z "$CORP_ID" ] || [ "$CORP_ID" == "wwxxxxxxxxxxxxx" ]; then
  echo -e "${RED}错误：请先编辑 .env 文件，填写企业微信的 CORP_ID${NC}"
  exit 1
fi
if [ -z "$AGENT_ID" ] || [ "$AGENT_ID" == "1000001" ]; then
  echo -e "${RED}错误：请先编辑 .env 文件，填写企业微信的 AGENT_ID${NC}"
  exit 1
fi
if [ -z "$AGENT_SECRET" ] || [ "$AGENT_SECRET" == "your-agent-secret-here" ]; then
  echo -e "${RED}错误：请先编辑 .env 文件，填写企业微信的 AGENT_SECRET${NC}"
  exit 1
fi

echo -e "${GREEN}✓ 企业微信凭证配置检查通过${NC}"
echo ""

# ── 1. 安装依赖 ─────────────────────────────────────────────
echo -e "${YELLOW}[1/4] 安装认证服务依赖...${NC}"
npm install --production
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# ── 2. 检查/安装 PM2 ───────────────────────────────────────
echo -e "${YELLOW}[2/4] 检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
  echo "安装 PM2..."
  npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 就绪${NC}"
echo ""

# ── 3. 停止旧进程（如有）───────────────────────────────────
echo -e "${YELLOW}[3/4] 停止旧认证服务...${NC}"
pm2 delete z1-docs-auth 2>/dev/null || true
echo -e "${GREEN}✓ 已停止旧进程${NC}"
echo ""

# ── 4. 启动认证服务 ────────────────────────────────────────
echo -e "${YELLOW}[4/4] 启动认证服务...${NC}"
cd /www/wwwroot/z1-docs/server
pm2 start src/index.js --name z1-docs-auth
pm2 save
echo -e "${GREEN}✓ 认证服务已启动${NC}"
echo ""

# ── 5. 配置 Nginx ─────────────────────────────────────────
echo -e "${YELLOW}[5/5] 更新 Nginx 配置...${NC}"

# 备份
cp /www/server/panel/vhost/nginx/docs.whohi.cn.ssl.conf \
   /www/wwwlogs/docs.whohi.cn.ssl.conf.bak.$(date +%Y%m%d%H%M%S)

# 写入新配置
cat > /www/server/panel/vhost/nginx/docs.whohi.cn.ssl.conf << 'NGINX_EOF'
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

    # 企业微信认证 API 代理
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

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control 'public, immutable';
    }

    # SPA 路由 fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

# 检查并重载
if /www/server/nginx/sbin/nginx -t 2>&1 | grep -q "syntax is ok"; then
  /www/server/nginx/sbin/nginx -s reload
  echo -e "${GREEN}✓ Nginx 配置已更新并重载${NC}"
else
  echo -e "${RED}✗ Nginx 配置测试失败，已备份旧配置，请检查！${NC}"
  /www/server/nginx/sbin/nginx -t 2>&1
  exit 1
fi
echo ""

# ── 完成 ────────────────────────────────────────────────────
echo "=========================================="
echo -e "${GREEN}✓ 部署完成！${NC}"
echo "=========================================="
echo ""
echo "认证服务状态："
pm2 list | grep z1-docs-auth
echo ""
echo "验证命令："
echo "  curl https://docs.whohi.cn/auth-api/auth/status"
echo "  pm2 logs z1-docs-auth"
echo ""
echo -e "${YELLOW}注意：确保企业微信后台已配置可信域名：docs.whohi.cn${NC}"
echo ""
