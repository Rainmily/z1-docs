# z1-docs 项目核心知识

## 项目结构
- **项目地址**: `/Users/fan/www/Ai/z1-docs/` (本地) | `/www/wwwroot/z1-docs/` (服务器)
- **前端**: Rspress 静态站点，构建输出到 `doc_build/`，部署在 `https://docs.whohi.cn`
- **后端**: Express 服务 (端口 3001)，PM2 管理，进程名 `z1-docs-auth`
- **nginx 代理**: `/auth-api/` → `127.0.0.1:3001/` (去掉前缀)
- **服务器 SSH**: `ssh -i /Users/fan/key/claw.pem root@106.54.198.58 -p 22`

## 企业微信登录核心知识

### 根因：getUserInfo / getUserIdByCode 只返回 userid，不返回姓名
企业微信 OAuth/SDK 的 `getUserInfo` 和 `getUserIdByCode` API 只返回用户的 `userid`（即企业微信账号/邮箱格式），不返回姓名。

**修复方案**：在 `completeQrLogin` 和 `completeOAuthLogin` 中，拿到 `userid` 后调用 `getUserById`（企业通讯录 API）获取真实姓名。

### 完整登录流程
1. 用户扫码 → 企业微信 SDK postMessage `{code}` 给前端
2. 前端 POST `/code-login` → 后端
3. 后端调用 `getUserIdByCode` → 拿到 `userid`（zsqk@go0356.com）
4. 后端调用 `getUserById(companyId, userid)` → 拿到 `{name: "李亦凡", ...}`
5. 生成 token（base64，包含正确姓名）
6. 返回 `{token, user}` 给前端
7. 前端存入 `localStorage['zsqk_wecom_session']`（JSON 对象，不是原始 base64）
8. NavLoginButton 从 localStorage 读取 → navbar 显示 **"掌上乾坤 · 李亦凡"**

### localStorage 存储格式（重要）
- **正确格式**: `JSON.stringify({ userid, name, companyName, expires, ... })`
- **错误格式**: 直接存 base64 字符串（`JSON.parse` 会失败）
- **读取 key**: `zsqk_wecom_session`

### 后端关键端点
- `POST /auth/code-login` - SDK 扫码登录主入口
- `GET /auth/callback` - OAuth 回调（手机端 redirect）
- `POST /auth/test-login` - 测试端点（直接调用 getUserById，返回正确姓名）
- `GET /auth/status` - 查询当前 session 状态

### 前端关键组件
- `plugins/auth/NavLoginButton.tsx` - 导航栏用户徽章，读取 localStorage 显示姓名
- `plugins/auth/AuthGuard.tsx` - 权限守卫，处理登录状态
- `plugins/auth/base64Utf8.ts` - 浏览器安全的 base64 编解码（`safeAtob`）
- `docs/.auth/CallbackHandler.tsx` - OAuth 回调页面（处理手机端 redirect）
- `docs/.auth/WeComLoginVanilla.tsx` - PC 端企业微信扫码登录页

### 浏览器 base64 编解码
- Node.js `Buffer` 在浏览器中不存在（`ReferenceError: Buffer is not defined`）
- 使用 `safeAtob` + `decodeURIComponent` 处理 UTF-8 中文字符
- 使用 `safeBase64UrlDecode` 处理企业微信 OAuth state 参数（base64url 编码）

### PM2 相关
- 查看日志: `pm2 logs z1-docs-auth --lines 50 --nostream`
- 清空缓冲日志: `pm2 flush z1-docs-auth`
- 重启: `pm2 restart z1-docs-auth`
- 日志缓冲：console.log 不是实时的，需要 `pm2 flush` 后再查看

## 已解决的问题
- ✅ navbar 显示姓名修复：后端 `completeQrLogin` / `completeOAuthLogin` 必须调用 `getUserById`
- ✅ `Buffer is not defined`：用 `safeAtob` / `safeBase64UrlDecode` 替代
- ✅ localStorage 存 raw base64：改为存解码后的 JSON 对象
- ✅ PM2 日志缓冲：需要 `pm2 flush` 才能看到实时输出
- ✅ dotenv 在 ESM + PM2 中正确加载（已验证）
