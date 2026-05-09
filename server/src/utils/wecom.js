/**
 * 企业微信多企业 OAuth 工具
 *
 * 核心改动：
 * - 每个企业有独立的 corpId + agentId + agentSecret
 * - 所有 API 调用都动态使用对应企业的凭证
 * - 企业微信认证类 API 返回 GBK 编码，通讯录 API 返回 UTF-8 编码
 */

import axios from 'axios';
import iconv from 'iconv-lite';

// ── axios 封装（智能选择编码）──────────────────────────────────
// 企业微信认证类接口（gettoken, getlogininfo, getuserinfo 等）：返回 GBK
// 企业微信通讯录接口（user/get 等）：返回 UTF-8
// 通过判断 URL 路径来决定编码
function wecomFetch(url, params) {
  return axios.get(url, {
    params,
    responseType: 'arraybuffer',
    timeout: 10000,
  }).then(res => {
    const buf = Buffer.from(res.data);
    // 通讯录相关接口使用 UTF-8，其他用 GBK
    const encoding = url.includes('/cgi-bin/user/') ? 'utf-8' : 'gbk';
    const str = iconv.decode(buf, encoding);
    return JSON.parse(str);
  });
}

function wecomPost(url, data, params) {
  return axios.post(url, data, {
    params,
    responseType: 'arraybuffer',
    timeout: 10000,
  }).then(res => {
    const buf = Buffer.from(res.data);
    // 通讯录相关接口使用 UTF-8，其他用 GBK
    const encoding = url.includes('/cgi-bin/user/') ? 'utf-8' : 'gbk';
    const str = iconv.decode(buf, encoding);
    return JSON.parse(str);
  });
}

// ── 多企业配置（从环境变量加载）───────────────────────────────
function loadMultiWecomConfig() {
  const raw = process.env.MULTI_WECOM_CONFIG;
  if (!raw) return [];
  try {
    const config = JSON.parse(raw);
    if (!Array.isArray(config)) {
      throw new Error('MULTI_WECOM_CONFIG 必须是数组格式');
    }
    return config;
  } catch (err) {
    console.error('[wecom] 解析 MULTI_WECOM_CONFIG 失败:', err.message);
    return [];
  }
}

/** 根据企业 ID 获取配置 */
export function getWecomConfig(companyId) {
  const all = loadMultiWecomConfig();
  const found = all.find((c) => c.id === companyId);
  if (!found) {
    throw new WeComAuthError(`未找到 ID 为 "${companyId}" 的企业配置`, 'COMPANY_NOT_FOUND');
  }
  return found;
}

/** 获取所有可用企业（用于登录页展示） */
export function getAllCompanies() {
  const all = loadMultiWecomConfig();
  return all.map(({ id, name, logo, corpId, agentId }) => ({ id, name, logo, corpId, agentId }));
}

/** 检查是否启用了多企业模式 */
export function isMultiTenantMode() {
  const raw = process.env.MULTI_WECOM_CONFIG;
  if (!raw) return false;
  try {
    return JSON.parse(raw).length > 1;
  } catch {
    return false;
  }
}

export class WeComAuthError extends Error {
  constructor(message, code = 'WECOM_ERROR') {
    super(message);
    this.name = 'WeComAuthError';
    this.code = code;
  }
}

// ── 单企业凭证模式（兼容旧配置）──────────────────────────────
function getLegacyConfig() {
  return {
    corpId: process.env.WECOM_CORP_ID,
    agentId: process.env.WECOM_AGENT_ID,
    agentSecret: process.env.WECOM_AGENT_SECRET,
  };
}

// ── 获取当前使用的凭证 ───────────────────────────────────────
function resolveConfig(companyId) {
  // 优先用多企业配置
  const raw = process.env.MULTI_WECOM_CONFIG;
  if (raw) {
    return getWecomConfig(companyId);
  }
  // 降级到单企业旧配置
  const legacy = getLegacyConfig();
  if (!legacy.corpId || !legacy.agentSecret) {
    throw new WeComAuthError('企业微信凭证未配置', 'NOT_CONFIGURED');
  }
  return {
    id: 'default',
    name: process.env.WECOM_COMPANY_NAME || '企业',
    logo: '',
    corpId: legacy.corpId,
    agentId: legacy.agentId,
    agentSecret: legacy.agentSecret,
    allowedUsers: process.env.ALLOWED_USERS || '',
  };
}

// ── AccessToken 缓存（每个企业独立缓存）──────────────────────
const tokenCache = new Map();

async function getAccessToken(companyId) {
  const config = resolveConfig(companyId);
  const cacheKey = config.corpId;
  const cached = tokenCache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const url = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken';
  const params = { corpid: config.corpId, corpsecret: config.agentSecret };
  const data = await wecomFetch(url, params);

  if (data.errcode !== 0) {
    throw new WeComAuthError(
      `获取 AccessToken 失败: ${data.errmsg} (${data.errcode})`,
      data.errcode.toString()
    );
  }

  // 企业微信 AccessToken 有效期 7200 秒，提前 5 分钟刷新
  const expiresAt = Date.now() + (data.expires_in - 300) * 1000;
  tokenCache.set(cacheKey, { token: data.access_token, expiresAt });

  return data.access_token;
}

/**
 * 构造扫码登录二维码 URL
 *
 * @param {string} companyId - 企业 ID
 * @param {string} redirectUri - 回调地址
 * @param {string} state - 防 CSRF 状态参数
 */
export function buildQrConnectUrl(companyId, redirectUri, state = '') {
  const config = resolveConfig(companyId);
  const params = new URLSearchParams({
    appid: config.corpId,
    agentid: config.agentId,
    redirect_uri: redirectUri,
    state: state,
  });
  return `https://open.work.weixin.qq.com/wwopen/sso/qrConnect?${params.toString()}`;
}

/**
 * 构造移动端 OAuth 授权链接
 *
 * @param {string} companyId - 企业 ID
 * @param {string} redirectUri - 回调地址
 * @param {string} state - 防 CSRF 状态参数
 * @param {string} scope - snsapi_base 或 snsapi_userinfo
 */
export function buildOAuthUrl(companyId, redirectUri, state = '', scope = 'snsapi_userinfo') {
  const config = resolveConfig(companyId);
  const params = new URLSearchParams({
    appid: config.corpId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state: state,
  });
  return `https://open.work.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}

/**
 * 获取登录用户信息（扫码登录）
 *
 * @param {string} companyId - 企业 ID
 * @param {string} code - 授权码
 */
async function getLoginInfo(companyId, code) {
  const accessToken = await getAccessToken(companyId);
  const url = 'https://qyapi.weixin.qq.com/cgi-bin/auth/getlogininfo';
  const params = { access_token: accessToken };

  const data = await wecomPost(url, { auth_code: code }, params);

  if (data.errcode !== 0) {
    throw new WeComAuthError(
      `获取登录信息失败: ${data.errmsg} (${data.errcode})`,
      data.errcode.toString()
    );
  }

  return data; // { errcode, errmsg, UserId, DeviceId, user_ticket, ... }
}

/**
 * 通过 OAuth code 获取成员 userid
 *
 * @param {string} companyId - 企业 ID
 * @param {string} code - OAuth 授权码
 */
async function getUserIdByCode(companyId, code) {
  const accessToken = await getAccessToken(companyId);
  const url = 'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo';
  const params = { access_token: accessToken, code };

  const data = await wecomFetch(url, params);

  if (data.errcode !== 0) {
    throw new WeComAuthError(
      `获取用户信息失败: ${data.errmsg} (${data.errcode})`,
      data.errcode.toString()
    );
  }

  return data;
}

/**
 * 获取成员详细信息（通过 user_ticket）
 */
async function getUserDetailByTicket(companyId, userTicket) {
  const accessToken = await getAccessToken(companyId);
  const url = 'https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo3rd';
  const params = { access_token: accessToken };

  const data = await wecomPost(url, { user_ticket: userTicket }, params);

  if (data.errcode !== 0) {
    throw new WeComAuthError(
      `获取用户详情失败: ${data.errmsg} (${data.errcode})`,
      data.errcode.toString()
    );
  }

  return data;
}

/**
 * 通过 userid 查询成员详情（通讯录接口，需要"查看通讯录"权限）
 */
export async function getUserById(companyId, userId) {
  const accessToken = await getAccessToken(companyId);
  const url = 'https://qyapi.weixin.qq.com/cgi-bin/user/get';
  const params = { access_token: accessToken, userid: userId };

  console.log('[getUserById] userId:', userId, '| token prefix:', accessToken.substring(0, 10));
  const data = await wecomFetch(url, params);
  console.log('[getUserById] errcode:', data.errcode, '| name:', data.name, '| userid:', data.userid);

  if (data.errcode !== 0) {
    // 无权限或其他错误，返回 null 不中断流程
    console.log('[getUserById] 失败, errmsg:', data.errmsg);
    return null;
  }

  return data; // { errcode, errmsg, userid, name, department, position, ... }
}

/**
 * 检查用户是否在允许名单中
 */
function checkAllowedUsers(companyId, userId) {
  const config = resolveConfig(companyId);
  const allowed = config.allowedUsers || '';
  if (!allowed) return true; // 空 = 允许所有成员
  const list = allowed.split(',').map((s) => s.trim()).filter(Boolean);
  return list.includes(userId);
}

// ── 完整登录流程 ─────────────────────────────────────────────

/**
 * PC 扫码登录流程
 *
 * @param {string} companyId - 企业 ID
 * @param {string} code - 扫码授权码
 * @returns {{ userid, name, avatar, companyId, companyName }}
 */
export async function completeQrLogin(companyId, code) {
  const config = resolveConfig(companyId);
  // PC 扫码 SDK 的 code 通过 getUserIdByCode 获取 userid
  const info = await getUserIdByCode(companyId, code);
  console.log('[completeQrLogin] getUserIdByCode result:', JSON.stringify(info));
  const { UserId, user_ticket } = info;

  if (!checkAllowedUsers(companyId, UserId)) {
    throw new WeComAuthError(
      `您不在 "${config.name}" 的允许访问名单中，请联系管理员`,
      'FORBIDDEN'
    );
  }

  // 通过通讯录查询获取真实姓名
  let userInfo = { userid: UserId, name: UserId };
  try {
    const contactInfo = await getUserById(companyId, UserId);
    console.log('[completeQrLogin] getUserById contactInfo:', JSON.stringify(contactInfo));
    if (contactInfo && contactInfo.name) {
      userInfo.name = contactInfo.name;
      if (contactInfo.avatar) userInfo.avatar = contactInfo.avatar;
    } else {
      console.log('[completeQrLogin] ⚠️ getUserById 返回空或无 name，降级为 userid');
    }
  } catch (e) {
    console.log('[completeQrLogin] ❌ getUserById 抛出异常:', e.message);
    // 通讯录查询失败，降级到 userid
  }
  console.log('[completeQrLogin] 最终 userInfo.name:', userInfo.name);

  return {
    ...userInfo,
    companyId: config.id,
    companyName: config.name,
  };
}

/**
 * 移动端 OAuth 登录流程
 *
 * @param {string} companyId - 企业 ID
 * @param {string} code - OAuth 授权码
 */
export async function completeOAuthLogin(companyId, code) {
  console.log('[completeOAuthLogin] START companyId:', companyId, 'code:', code ? code.substring(0,20)+'...' : 'empty');
  const config = resolveConfig(companyId);
  // 使用 getUserIdByCode（OAuth 标准接口，支持 SDK 和移动端登录）
  const info = await getUserIdByCode(companyId, code);
  console.log('[completeOAuthLogin] getUserIdByCode result:', JSON.stringify(info));
  const { UserId, user_ticket } = info;

  if (!UserId) {
    throw new WeComAuthError(
      '无法获取用户身份（可能不在应用的授权范围内）',
      'NO_USERID'
    );
  }

  if (!checkAllowedUsers(companyId, UserId)) {
    throw new WeComAuthError(
      `您不在 "${config.name}" 的允许访问名单中，请联系管理员`,
      'FORBIDDEN'
    );
  }

  // 通过通讯录查询获取真实姓名
  let userInfo = { userid: UserId, name: UserId };
  try {
    const contactInfo = await getUserById(companyId, UserId);
    console.log('[completeOAuthLogin] getUserById contactInfo:', JSON.stringify(contactInfo));
    if (contactInfo && contactInfo.name) {
      userInfo.name = contactInfo.name;
      if (contactInfo.avatar) userInfo.avatar = contactInfo.avatar;
    } else {
      console.log('[completeOAuthLogin] ⚠️ getUserById 返回空或无 name，降级为 userid');
    }
  } catch (e) {
    console.log('[completeOAuthLogin] ❌ getUserById 抛出异常:', e.message, e.stack);
    // 通讯录查询失败，降级到 userid
  }
  console.log('[completeOAuthLogin] 最终 userInfo.name:', userInfo.name);

  return {
    ...userInfo,
    companyId: config.id,
    companyName: config.name,
  };
}
