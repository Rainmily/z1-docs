/**
 * 本地 Mock 认证服务器
 * 用于本地开发测试企业微信登录功能
 *
 * 启动方式：node mock-server.js
 */

import http from 'http';
import url from 'url';

const PORT = 3001;

const companies = [
  {
    id: 'test-company',
    name: '测试企业',
    logo: '',
    corpId: 'ww1234567890abcdef',  // 需要替换为真实的 corpId
    agentId: '1000001',            // 需要替换为真实的 agentId
  },
];

const users = [
  { userid: 'admin', name: '管理员', department: '总部' },
  { userid: 'test01', name: '测试用户', department: '门店' },
];

function createToken(user) {
  return Buffer.from(JSON.stringify({
    ...user,
    loginTime: Date.now(),
    expires: Date.now() + 8 * 60 * 60 * 1000, // 8小时后过期
  })).toString('base64');
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 模拟 API 延迟
  setTimeout(() => {
    if (pathname === '/auth/companies') {
      res.writeHead(200);
      res.end(JSON.stringify({
        companies,
        multiTenant: false,
      }));
    } else if (pathname === '/auth/qr-url') {
      const companyId = parsedUrl.query.companyId;
      const company = companies.find(c => c.id === companyId);

      if (company && company.corpId && company.agentId) {
        // 返回企业微信授权地址
        // 实际项目中这里应该是真实的企业微信 OAuth 地址
        const redirectUri = encodeURIComponent(`http://localhost:3000/auth/callback`);
        const qrUrl = `https://open.work.weixin.qq.com/wwopen/sso/authorize?appid=${company.corpId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=${companyId}#wechat_redirect`;

        res.writeHead(200);
        res.end(JSON.stringify({ url: qrUrl }));
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ error: '企业未配置企业微信应用' }));
      }
    } else if (pathname === '/auth/code-login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { code, companyId } = JSON.parse(body);

          // Mock: 使用固定的用户信息
          const mockUser = users[0];
          const token = createToken(mockUser);

          res.writeHead(200);
          res.end(JSON.stringify({
            token,
            user: mockUser,
          }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: '请求格式错误' }));
        }
      });
    } else if (pathname === '/auth/verify') {
      res.writeHead(200);
      res.end(JSON.stringify({ valid: true }));
    } else if (pathname === '/auth/logout') {
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    } else if (pathname === '/mock-login') {
      // 方便测试：直接用固定用户登录
      const mockUser = users[0];
      const token = createToken(mockUser);

      res.writeHead(200);
      res.end(JSON.stringify({
        token,
        user: mockUser,
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'API not found' }));
    }
  }, 100);
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          掌上乾坤 - 本地 Mock 认证服务                    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ✅ 服务器已启动: http://localhost:${PORT}                   ║
║                                                           ║
║  可用 API:                                                ║
║    GET  /auth/companies  - 获取企业列表                   ║
║    GET  /auth/qr-url     - 获取登录二维码地址             ║
║    POST /auth/code-login - 扫码登录回调                   ║
║    POST /auth/verify     - 验证登录状态                  ║
║    POST /auth/logout     - 退出登录                      ║
║                                                           ║
║  测试入口: http://localhost:3000/mock-login              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
