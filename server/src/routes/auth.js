/**
 * 多企业认证路由
 *
 * 核心改动：
 * - /auth/companies  → 返回可用企业列表（前端展示选择）
 * - /auth/qr-url     → 支持 companyId 参数
 * - /auth/oauth-url  → 支持 companyId 参数
 * - /auth/callback   → 从 state 中解析 companyId，路由到对应企业
 */

import express from 'express';
import crypto from 'crypto';
import {
  buildQrConnectUrl,
  buildOAuthUrl,
  completeQrLogin,
  completeOAuthLogin,
  getAllCompanies,
  isMultiTenantMode,
  getWecomConfig,
} from '../utils/wecom.js';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;

const SESSION_KEY = 'wecom_user';

// ── State 格式约定 ─────────────────────────────────────────────
// state = base64(JSON.stringify({ companyId, type, random }))
// 示例: {"companyId":"zsqk","type":"qr","random":"abc123"}
function encodeState(companyId, type) {
  const raw = JSON.stringify({
    companyId,
    type,
    random: crypto.randomBytes(8).toString('hex'),
  });
  return Buffer.from(raw).toString('base64url');
}

function decodeState(state) {
  try {
    const raw = Buffer.from(state, 'base64url').toString('utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  if (!req.session[SESSION_KEY]) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: '请先登录' });
  }
  next();
}

// ════════════════════════════════════════════════════════════════
// 端点 1：获取可用企业列表
// 前端登录页调用，展示企业选择列表
// ════════════════════════════════════════════════════════════════
router.get('/companies', (req, res) => {
  const companies = getAllCompanies();
  const multiTenant = isMultiTenantMode();

  res.json({
    multiTenant,
    companies,
    // 单企业模式下也返回（方便前端统一处理）
    defaultCompany: multiTenant ? null : companies[0] || null,
  });
});

// ════════════════════════════════════════════════════════════════
// 端点 2：获取扫码登录 URL（PC端）
// query 参数: companyId（企业ID）
// ════════════════════════════════════════════════════════════════
router.get('/qr-url', (req, res) => {
  const { companyId } = req.query;

  if (!companyId) {
    return res.status(400).json({ error: '缺少 companyId 参数' });
  }

  try {
    // 验证企业 ID 有效
    getWecomConfig(companyId);

    const state = encodeState(companyId, 'qr');
    req.session.oauthState = state;

    // 回调到后端，后端处理完成后重定向到前端
    const callbackUrl = `${SERVER_URL}/auth/callback`;
    const url = buildQrConnectUrl(companyId, callbackUrl, state);

    res.json({ url, state, companyId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 端点 3：获取移动端 OAuth 授权链接
// query 参数: companyId（企业ID）
// ════════════════════════════════════════════════════════════════
router.get('/oauth-url', (req, res) => {
  const { companyId } = req.query;

  if (!companyId) {
    return res.status(400).json({ error: '缺少 companyId 参数' });
  }

  try {
    getWecomConfig(companyId);

    const state = encodeState(companyId, 'oauth');
    req.session.oauthState = state;

    const callbackUrl = `${SERVER_URL}/auth/callback`;
    const url = buildOAuthUrl(companyId, callbackUrl, state, 'snsapi_userinfo');

    res.json({ url, companyId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 端点 4：企业微信回调（核心）
// PC扫码 + 移动端OAuth 都回调这里
// 从 state 中解析出 companyId，用对应企业的凭证完成登录
// ════════════════════════════════════════════════════════════════
router.get('/callback', async (req, res) => {
  const { code, state, auth_code } = req.query;

  try {
    // 1. 解析 state（包含 companyId + 登录类型）
    if (!state) {
      throw new Error('缺少 state 参数');
    }

    const stateData = decodeState(state);
    if (!stateData || !stateData.companyId) {
      throw new Error('State 格式无效，请重新扫码');
    }

    const { companyId, type } = stateData;

    // 2. 用对应企业的凭证完成登录
    let userInfo;
    if (type === 'oauth' && code) {
      userInfo = await completeOAuthLogin(companyId, code);
    } else if (auth_code) {
      userInfo = await completeQrLogin(companyId, auth_code);
    } else if (code) {
      userInfo = await completeQrLogin(companyId, code);
    } else {
      throw new Error('未获取到授权码（用户可能取消了授权）');
    }

    // 3. 写入 Session
    req.session[SESSION_KEY] = {
      ...userInfo,
      loginTime: Date.now(),
      loginType: type,
    };

    // 4. 生成前端 token
    const sessionToken = Buffer.from(JSON.stringify({
      ...userInfo,
      loginTime: Date.now(),
      expires: Date.now() + 8 * 60 * 60 * 1000,
    })).toString('base64');

    // 5. 重定向到前端成功页
    const redirectUrl = new URL(`${FRONTEND_URL}/auth/success`);
    redirectUrl.searchParams.set('token', sessionToken);
    res.redirect(redirectUrl.toString());

  } catch (err) {
    console.error('[Callback Error]', err.message);

    const errorUrl = new URL(`${FRONTEND_URL}/auth/error`);
    errorUrl.searchParams.set('message', encodeURIComponent(err.message));
    res.redirect(errorUrl.toString());
  }
});

// ════════════════════════════════════════════════════════════════
// 端点 5：查询登录状态
// ════════════════════════════════════════════════════════════════
router.get('/status', (req, res) => {
  const user = req.session[SESSION_KEY];
  if (user) {
    res.json({
      loggedIn: true,
      user: {
        userid: user.userid,
        name: user.name || user.userid,
        avatar: user.avatar,
        companyId: user.companyId,
        companyName: user.companyName,
        loginTime: user.loginTime,
      },
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// ════════════════════════════════════════════════════════════════
// 端点 6：退出登录
// ════════════════════════════════════════════════════════════════
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: '退出失败' });
    res.json({ success: true });
  });
});

// ════════════════════════════════════════════════════════════════
// 端点 7：验证 Token
// ════════════════════════════════════════════════════════════════
router.post('/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: '缺少 token' });

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (Date.now() > decoded.expires) {
      return res.status(401).json({ error: 'Token 已过期' });
    }
    res.json({
      valid: true,
      user: {
        userid: decoded.userid,
        name: decoded.name,
        avatar: decoded.avatar,
        companyId: decoded.companyId,
        companyName: decoded.companyName,
        loginTime: decoded.loginTime,
      },
    });
  } catch {
    res.status(401).json({ error: '无效的 Token' });
  }
});

// ════════════════════════════════════════════════════════════════
// 端点 8：企业微信 SDK 登录（code 换 token）
// 前端 SDK 登录成功后调用此接口
// ════════════════════════════════════════════════════════════════
router.post('/code-login', async (req, res) => {
  const { code, companyId } = req.body;

  if (!code) {
    return res.status(400).json({ error: '缺少 code 参数' });
  }

  // 如果没有指定 companyId，尝试从 state 中解析（SDK 登录时传递的 state）
  // 但 SDK 的 state 格式与 OAuth 不同，这里简化处理：如果没传 companyId，尝试使用第一个企业
  let resolvedCompanyId = companyId;
  if (!resolvedCompanyId) {
    const companies = getAllCompanies();
    if (companies.length > 0) {
      resolvedCompanyId = companies[0].id;
    }
  }

  try {
    // 使用 OAuth 流程完成登录（与 completeOAuthLogin 相同）
    const userInfo = await completeOAuthLogin(resolvedCompanyId, code);

    // 写入 Session
    req.session[SESSION_KEY] = {
      ...userInfo,
      loginTime: Date.now(),
      loginType: 'sdk',
    };

    // 生成前端 token
    const sessionToken = Buffer.from(JSON.stringify({
      ...userInfo,
      loginTime: Date.now(),
      expires: Date.now() + 8 * 60 * 60 * 1000,
    })).toString('base64');

    res.json({ token: sessionToken, user: userInfo });
  } catch (err) {
    console.error('[CodeLogin Error]', err.message);
    res.status(401).json({ error: err.message });
  }
});

export default router;
