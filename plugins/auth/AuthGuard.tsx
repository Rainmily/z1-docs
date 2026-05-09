/**
 * AuthGuard - 企业微信登录权限守卫
 *
 * 功能：
 * 1. 启动时检查 localStorage session
 * 2. 无 session 时显示企业微信登录页
 * 3. 处理登录成功/失败的 URL 回调
 * 4. 监听路由变化，实时检查权限
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { safeAtob } from './base64Utf8';
import WeComLoginWrapper from './WeComLoginWrapper';

interface AuthConfig {
  enabled: boolean;
  apiBase: string;
  protectedPaths: string[];
  publicPaths: string[];
  showUserBadge: boolean;
}

interface SessionUser {
  userid: string;
  name?: string;
  avatar?: string;
  loginTime: number;
  expires: number;
}

declare global {
  interface Window {
    __ZSQK_AUTH_CONFIG__?: AuthConfig;
  }
}

// ── 从 localStorage 恢复 session ───────────────────────────────
function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem('zsqk_wecom_session');
    if (!raw) return null;
    const session: SessionUser = JSON.parse(raw);
    if (Date.now() > session.expires) {
      localStorage.removeItem('zsqk_wecom_session');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// ── 路径匹配 ────────────────────────────────────────────────────
function matchPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    // 精确匹配根路径 /
    if (p === '/') return pathname === '/';
    return pathname === p || pathname.startsWith(p);
  });
}

// ── 权限检查函数 ────────────────────────────────────────────────
function checkAuth(config: {
  enabled: boolean;
  publicPaths: string[];
  protectedPaths: string[];
}): { shouldLogin: boolean; isLoginPage: boolean; isCallbackPage: boolean } {
  const pathname = window.location.pathname;

  // 登录页面 & 回调页面：直接放行
  if (pathname === '/auth/login' || pathname === '/auth/callback') {
    return { shouldLogin: false, isLoginPage: pathname === '/auth/login', isCallbackPage: pathname === '/auth/callback' };
  }

  // 权限控制未启用：放行
  if (!config.enabled) {
    return { shouldLogin: false, isLoginPage: false, isCallbackPage: false };
  }

  // 检查 URL 参数中的 token 和错误信息
  const params = new URLSearchParams(window.location.search);
  const token = params.get('auth_token') || params.get('token');
  const errorMsg = params.get('auth_error') || params.get('message');

  // 公开路径：放行
  if (matchPath(pathname, config.publicPaths)) {
    return { shouldLogin: false, isLoginPage: false, isCallbackPage: false };
  }

  // 检查是否为受保护路径
  const isProtected = matchPath(pathname, config.protectedPaths);

  // 如果是受保护路径且无 session，需要登录
  if (isProtected && !loadSession()) {
    return { shouldLogin: true, isLoginPage: false, isCallbackPage: false };
  }

  return { shouldLogin: false, isLoginPage: false, isCallbackPage: false };
}

// ── 登录错误页面 ───────────────────────────────────────────────
function AuthErrorDisplay({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        background: '#f5f5f5',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '32px 40px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            background: '#fee',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 16px',
          }}
        >
          ❌
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#333' }}>
          登录失败
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#666' }}>
          {decodeURIComponent(message) || '未知错误，请联系管理员'}
        </p>
        <button
          onClick={() => {
            window.history.replaceState({}, '', window.location.pathname);
            window.location.reload();
          }}
          style={{
            padding: '10px 24px',
            background: '#1aad19',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          重新登录
        </button>
      </div>
    </div>
  );
}

// ── 主守卫组件 Props ────────────────────────────────────────────
interface AuthGuardProps {
  children: React.ReactNode;
  enabled?: boolean;
  apiBase?: string;
  protectedPaths?: string[];
  publicPaths?: string[];
  showUserBadge?: boolean;
  trustedDomain?: string;
}

// ── 主守卫组件 ──────────────────────────────────────────────────
export default function AuthGuard({
  children,
  enabled = true,
  apiBase = '/auth-api',
  protectedPaths = [],
  publicPaths = [],
  showUserBadge = true,
  trustedDomain = '/auth-api',
}: AuthGuardProps) {
  // 稳定的配置值
  const config = useMemo(() => {
    const globalConfig = typeof window !== 'undefined' ? (window as any).__ZSQK_AUTH_CONFIG__ : null;
    return {
      enabled: globalConfig?.enabled ?? enabled,
      apiBase: globalConfig?.apiBase || apiBase,
      protectedPaths: globalConfig?.protectedPaths || protectedPaths,
      publicPaths: globalConfig?.publicPaths || publicPaths,
      showUserBadge: globalConfig?.showUserBadge ?? showUserBadge,
      trustedDomain: globalConfig?.trustedDomain || trustedDomain,
    };
  }, []);

  const [session, setSession] = useState<SessionUser | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [checkKey, setCheckKey] = useState(0); // 用于触发重新检查

  // 初始化：处理 token 和错误
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('auth_token') || params.get('token');
    const errorMsg = params.get('auth_error') || params.get('message');

    if (errorMsg) {
      setLoginError(errorMsg);
      // 清除 URL 参数
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (token) {
      try {
        const decoded: SessionUser = JSON.parse(safeAtob(token));
        if (Date.now() <= decoded.expires) {
          localStorage.setItem('zsqk_wecom_session', JSON.stringify(decoded));
          setSession(decoded);
          // 清除 URL 参数
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          setSession(loadSession());
        }
      } catch {
        setSession(loadSession());
      }
    } else {
      setSession(loadSession());
    }
  }, []);

  // 权限检查 + 路由监听
  useEffect(() => {
    const pathname = window.location.pathname;

    // 登录页面：渲染登录组件
    if (pathname === '/auth/login') {
      return;
    }

    // 回调页面：放行，让页面自己的 CallbackHandler 处理
    if (pathname === '/auth/callback') {
      return;
    }

    // 权限控制未启用：放行
    if (!config.enabled) {
      return;
    }

    // 公开路径：放行
    if (matchPath(pathname, config.publicPaths)) {
      return;
    }

    // 受保护路径检查（直接检查 localStorage，不依赖 session 状态）
    const isProtected = matchPath(pathname, config.protectedPaths);
    const currentSession = loadSession();

    if (isProtected && !currentSession && !loginError) {
      // 保存返回 URL 并跳转登录
      sessionStorage.setItem('auth_return_url', pathname);
      window.location.href = '/auth/login';
    }
  }, [config, loginError, checkKey]);

  // 监听路由变化（popstate 和导航链接点击）
  useEffect(() => {
    let lastPath = window.location.pathname;

    const handleRouteChange = () => {
      const newPath = window.location.pathname;
      if (newPath !== lastPath) {
        lastPath = newPath;
        // 重新加载 session（可能在其他标签页登录了）
        setSession(loadSession());
        // 触发权限重新检查
        setCheckKey(k => k + 1);
      }
    };

    // 监听浏览器前进/后退
    window.addEventListener('popstate', handleRouteChange);

    // 监听导航链接点击（捕获 Rspress 的客户端路由导航）
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // 检查是否点击了导航链接
      const link = target.closest('a');
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        const newPath = new URL(link.href).pathname;
        if (newPath !== lastPath) {
          // 延迟检查，等待路由实际变化
          setTimeout(handleRouteChange, 100);
        }
      }
    });

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // 退出登录
  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${config.apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // 即使请求失败也清理本地状态
    }
    localStorage.removeItem('zsqk_wecom_session');
    setSession(null);
    window.location.href = '/';
  }, [config.apiBase]);

  // 登录错误页面
  if (loginError) {
    return <AuthErrorDisplay message={loginError} />;
  }

  // 登录页面
  if (window.location.pathname === '/auth/login') {
    return <WeComLoginWrapper />;
  }

  // 渲染内容
  return <>{children}</>;
}
