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

router.get('/companies', (req, res) => {
  const companies = getAllCompanies();
  const multiTenant = isMultiTenantMode();

  res.json({
    multiTenant,
    companies,
    defaultCompany: multiTenant ? null : companies[0] || null,
  });
});

router.get('/qr-url', (req, res) => {
  const { companyId } = req.query;

  if (!companyId) {
    return res.status(400).json({ error: '缺少 companyId 参数' });
  }

  try {
    getWecomConfig(companyId);

    const state = encodeState(companyId, 'qr');
    req.session.oauthState = state;

    const callbackUrl = `${SERVER_URL}/auth/callback`;
    const url = buildQrConnectUrl(companyId, callbackUrl, state);

    res.json({ url, state, companyId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

router.get('/callback', async (req, res) => {
  const { code, state, auth_code } = req.query;

  try {
    if (!state) {
      throw new Error('缺少 state 参数');
    }

    const stateData = decodeState(state);
    if (!stateData || !stateData.companyId) {
      throw new Error('State 格式无效，请重新扫码');
    }

    const { companyId, type } = stateData;

    let userInfo;
    console.log('[Callback] type:', type, '| code:', code ? code.substring(0,20)+'...' : 'none', '| auth_code:', auth_code ? 'yes' : 'none');
    if (type === 'oauth' && code) {
      console.log('[Callback] 使用 completeOAuthLogin');
      userInfo = await completeOAuthLogin(companyId, code);
    } else if (auth_code) {
      console.log('[Callback] 使用 completeQrLogin (auth_code)');
      userInfo = await completeQrLogin(companyId, auth_code);
    } else if (code) {
      console.log('[Callback] 使用 completeQrLogin (code)');
      userInfo = await completeQrLogin(companyId, code);
    } else {
      throw new Error('未获取到授权码（用户可能取消了授权）');
    }
    console.log('[Callback] userInfo.name:', userInfo.name, '| userid:', userInfo.userid);

    req.session[SESSION_KEY] = {
      ...userInfo,
      loginTime: Date.now(),
      loginType: type,
    };

    const sessionToken = Buffer.from(JSON.stringify({
      ...userInfo,
      loginTime: Date.now(),
      expires: Date.now() + 8 * 60 * 60 * 1000,
    })).toString('base64');

    const redirectUrl = new URL(`${FRONTEND_URL}/`);
    redirectUrl.searchParams.set('auth_token', sessionToken);
    res.redirect(redirectUrl.toString());

  } catch (err) {
    console.error('[Callback Error]', err.message);

    const errorUrl = new URL(`${FRONTEND_URL}/`);
    errorUrl.searchParams.set('auth_error', err.message);
    res.redirect(errorUrl.toString());
  }
});

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

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: '退出失败' });
    res.json({ success: true });
  });
});

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

router.post('/code-login', async (req, res) => {
  const { code, companyId } = req.body;
  console.log('[code-login] 收到请求, code:', code ? code.substring(0,15)+'...' : '无', '| companyId:', companyId);

  if (!code) {
    console.log('[code-login] ❌ 缺少 code 参数');
    return res.status(400).json({ error: '缺少 code 参数' });
  }

  let resolvedCompanyId = companyId;
  if (!resolvedCompanyId) {
    const companies = getAllCompanies();
    if (companies.length > 0) {
      resolvedCompanyId = companies[0].id;
    }
  }
  console.log('[code-login] 使用 companyId:', resolvedCompanyId);

  try {
    const userInfo = await completeOAuthLogin(resolvedCompanyId, code);

    req.session[SESSION_KEY] = {
      ...userInfo,
      loginTime: Date.now(),
      loginType: 'sdk',
    };

    const sessionToken = Buffer.from(JSON.stringify({
      ...userInfo,
      loginTime: Date.now(),
      expires: Date.now() + 8 * 60 * 60 * 1000,
    })).toString('base64');

    console.log('[code-login] ✅ 成功, userInfo.name:', userInfo.name, '| userid:', userInfo.userid);
    res.json({ token: sessionToken, user: userInfo, _debug: { name: userInfo.name, userid: userInfo.userid } });
  } catch (err) {
    console.error('[CodeLogin Error]', err.message);
    res.status(401).json({ error: err.message });
  }
});
export default router;
