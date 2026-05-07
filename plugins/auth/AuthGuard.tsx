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

import React, { useState, useEffect, useCallback } from 'react';
import WeComLogin from './WeComLogin';

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

// ── 用户徽章组件 ───────────────────────────────────────────────
function UserBadge({ session, onLogout, onLogin }: {
  session: SessionUser | null;
  onLogout: () => void;
  onLogin: () => void;
}) {
  const badgeStyle: React.CSSProperties = {
    position: 'fixed',
    top: '12px',
    right: '12px',
    zIndex: 9999,
    background: 'rgba(26, 173, 25, 0.92)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 12px rgba(26, 173, 25, 0.3)',
    fontFamily: 'system-ui, sans-serif',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '10px',
  };

  return (
    <div style={badgeStyle}>
      {session ? (
        <>
          <span>👤 {session.name || session.userid}</span>
          <button onClick={onLogout} title="退出登录" style={buttonStyle}>
            退出
          </button>
        </>
      ) : (
        <button onClick={onLogin} title="登录" style={buttonStyle}>
          登录
        </button>
      )}
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
  showUserBadge = false,
  trustedDomain = '/auth-api',
}: AuthGuardProps) {
  const safeApiBase = apiBase || '/auth-api';
  const isServer = typeof window === 'undefined';
  const [session, setSession] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(isServer ? false : true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthPage, setIsAuthPage] = useState(false);
  const [isLoginPage, setIsLoginPage] = useState(false);

  // ── 初始化：检查 URL 参数 + localStorage ─────────────────────
  useEffect(() => {
    // SSR 时跳过客户端逻辑
    if (isServer) {
      return;
    }

    // 检查是否为登录页面
    if (window.location.pathname === '/auth/login') {
      setIsLoginPage(true);
      setIsLoading(false);
      return;
    }

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('auth_token') || params.get('token');
    const errorMsg = params.get('auth_error') || params.get('message');

    if (errorMsg) {
      setIsAuthPage(true);
      setLoginError(errorMsg);
      setIsLoading(false);
      return;
    }

    if (token) {
      try {
        const decoded: SessionUser = JSON.parse(atob(token));
        if (Date.now() <= decoded.expires) {
          localStorage.setItem('zsqk_wecom_session', JSON.stringify(decoded));
          setSession(decoded);
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch {
        // token 解析失败
      }
    } else {
      setSession(loadSession());
    }

    setIsLoading(false);
  }, [enabled]);

  // ── 路由变化时检查权限 ────────────────────────────────────────
  useEffect(() => {
    if (!enabled || isLoading || isServer) return;

    const pathname = window.location.pathname;

    // 跳过登录页面本身的检查
    if (pathname === '/auth/login') {
      return;
    }

    // 公开路径：跳过权限检查
    if (matchPath(pathname, publicPaths)) {
      return;
    }

    // 检查是否为受保护路径且无 session
    const isProtected = protectedPaths.length === 0 || matchPath(pathname, protectedPaths);

    if (isProtected && !loadSession()) {
      // 跳转到登录页面
      sessionStorage.setItem('auth_return_url', pathname);
      window.location.href = '/auth/login';
    }
  }, [isServer, isLoading, enabled, protectedPaths, publicPaths]);

  // ── 定期验证 session（每 30 分钟）───────────────────────────
  useEffect(() => {
    if (!enabled || !session || isServer) return;

    const verifyInterval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: btoa(JSON.stringify(session)) }),
        });
        if (!res.ok) {
          localStorage.removeItem('zsqk_wecom_session');
          setSession(null);
        }
      } catch {
        // 网络错误时保持 session
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(verifyInterval);
  }, [enabled, session, apiBase]);

  // ── 登录成功回调 ─────────────────────────────────────────────
  const handleLoginSuccess = useCallback((token: string) => {
    try {
      const decoded: SessionUser = JSON.parse(atob(token));
      localStorage.setItem('zsqk_wecom_session', JSON.stringify(decoded));
      setSession(decoded);
      setIsAuthPage(false);
      setShowLoginPanel(false);
      window.history.replaceState({}, '', window.location.pathname);
    } catch {
      setLoginError('登录状态解析失败');
    }
  }, []);

  // ── 退出登录 ─────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // 即使请求失败也清理本地状态
    }
    localStorage.removeItem('zsqk_wecom_session');
    setSession(null);
  }, [apiBase]);

  // ── 加载中 ───────────────────────────────────────────────────
  if (isLoading) {
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

  // ── 错误页面 ─────────────────────────────────────────────────
  if (isAuthPage && loginError) {
    return <AuthErrorDisplay message={loginError} />;
  }

  // ── 登录页面 ─────────────────────────────────────────────────
  if (isLoginPage) {
    return <WeComLogin apiBase={safeApiBase} />;
  }

  // ── 渲染内容 + 用户徽章 ───────────────────────────────────────
  return (
    <>
      {children}
      {showUserBadge && (
        <UserBadge
          session={session}
          onLogout={handleLogout}
          onLogin={() => {
            sessionStorage.setItem('auth_return_url', window.location.pathname);
            window.location.href = '/auth/login';
          }}
        />
      )}
    </>
  );
}