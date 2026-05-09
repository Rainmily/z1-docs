/**
 * AuthGuard - 企业微信登录权限守卫
 *
 * 功能：
 * 1. 启动时检查 localStorage session
 * 2. 无 session 时显示企业微信登录页
 * 3. 处理登录成功/失败的 URL 回调
 * 4. 右上角显示用户徽章 + 登录/退出按钮
 * 5. 定期向后端验证 session 有效性
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { safeAtob } from './base64Utf8';

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
  return patterns.some((p) => pathname === p || pathname.startsWith(p));
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
  // 稳定的配置值（只在组件首次挂载时读取一次）
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
  }, []); // 空的依赖数组，只执行一次

  const [session, setSession] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');

  // 统一在 useEffect 中处理所有 window 相关逻辑
  useEffect(() => {
    // 统一获取当前路径（避免渲染体直接读 window）
    const pathname = window.location.pathname;
    setCurrentPath(pathname);

    // 登录页面 & 回调页面：直接显示对应组件，不做权限检查
    if (pathname === '/auth/login' || pathname === '/auth/callback') {
      setIsReady(true);
      return;
    }

    if (!config.enabled) {
      setIsReady(true);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('auth_token') || params.get('token');
    const errorMsg = params.get('auth_error') || params.get('message');

    if (errorMsg) {
      setLoginError(errorMsg);
      setIsReady(true);
      return;
    }

    if (token) {
      try {
        const decoded: SessionUser = JSON.parse(safeAtob(token));
        if (Date.now() <= decoded.expires) {
          localStorage.setItem('zsqk_wecom_session', JSON.stringify(decoded));
          setSession(decoded);
          window.history.replaceState({}, '', pathname);
        } else {
          setSession(loadSession());
        }
      } catch {
        setSession(loadSession());
      }
    } else {
      setSession(loadSession());
    }

    setIsReady(true);
  }, [config.enabled]);

  // 路由变化时检查权限（依赖 currentPath 变化触发）
  useEffect(() => {
    if (!isReady || !config.enabled) return;

    const pathname = currentPath || window.location.pathname;

    // 跳过登录页面 & 回调页面
    if (pathname === '/auth/login' || pathname === '/auth/callback') {
      return;
    }

    // 公开路径：跳过权限检查
    if (matchPath(pathname, config.publicPaths)) {
      return;
    }

    // 检查是否为受保护路径且无 session
    const isProtected = config.protectedPaths.length === 0 || matchPath(pathname, config.protectedPaths);

    if (isProtected && !loadSession()) {
      // 跳转到登录页面（使用 rspress 的 navigate 系统）
      sessionStorage.setItem('auth_return_url', pathname);
      // @ts-ignore
      const navigate = window.__rspressNavigate || window.__RSPRESS_NAVIGATE__;
      if (navigate) {
        navigate('/auth/login');
      } else {
        window.location.href = '/auth/login';
      }
    }
  }, [isReady, config.enabled, config.protectedPaths, config.publicPaths, currentPath]);

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
  }, [config.apiBase]);

  // 登录页面 — 渲染 WeComLogin
  if (currentPath === '/auth/login') {
    return <WeComLogin apiBase={config.apiBase} />;
  }

  // 回调页面 — 不在这里渲染，让页面自己的 CallbackHandler 处理
  // 此处只做权限放行（children 会被渲染）

  // 错误页面
  if (loginError) {
    return <AuthErrorDisplay message={loginError} />;
  }

  // 加载中
  if (!isReady) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          color: '#666',
          fontSize: '14px',
        }}
      >
        <span>正在验证身份...</span>
      </div>
    );
  }

  // 渲染内容（用户徽章现在通过主题的 afterNavMenu 插槽渲染）
  return <>{children}</>;
}
