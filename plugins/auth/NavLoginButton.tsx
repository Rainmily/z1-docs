/**
 * 导航栏登录按钮组件
 * 用于在 rspress 主题的 afterNavMenu 插槽中渲染
 */

import React, { useState, useEffect } from 'react';

interface SessionUser {
  userid: string;
  name?: string;
  avatar?: string;
  companyId?: string;
  companyName?: string;
  loginTime: number;
  expires: number;
}

// 获取 API base URL
function getApiBase() {
  return (window as any).__ZSQK_AUTH_CONFIG__?.apiBase || '/auth-api';
}

// 从服务器 session 获取用户信息（绕过 token 解析问题）
async function fetchSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${getApiBase()}/auth/status`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.loggedIn && data.user) {
      return {
        userid: data.user.userid || '',
        name: data.user.name || data.user.userid || '',
        avatar: data.user.avatar || '',
        companyId: data.user.companyId || '',
        companyName: data.user.companyName || '',
        loginTime: data.user.loginTime || Date.now(),
        expires: Date.now() + 8 * 60 * 60 * 1000,
      };
    }
  } catch {
    // 网络错误，忽略
  }
  return null;
}

export function NavLoginButton() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 从 localStorage 快速加载（同步，无闪烁）
    try {
      const raw = localStorage.getItem('zsqk_wecom_session');
      if (raw) {
        const data = JSON.parse(raw);
        if (Date.now() <= (data.expires || 0)) {
          setSession(data);
        } else {
          localStorage.removeItem('zsqk_wecom_session');
        }
      }
    } catch {
      // ignore
    }
    setIsReady(true);

    // 从服务器 session 获取最新数据（异步，覆盖 localStorage 数据）
    fetchSession().then(serverSession => {
      if (serverSession) {
        // 用服务器数据覆盖本地数据
        localStorage.setItem('zsqk_wecom_session', JSON.stringify(serverSession));
        setSession(serverSession);
      }
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('zsqk_wecom_session');
    fetch(`${getApiBase()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setSession(null);
      window.location.reload();
    });
  };

  const handleLogin = () => {
    sessionStorage.setItem('auth_return_url', window.location.pathname);
    window.history.pushState({}, '', '/auth/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isReady) {
    return null;
  }

  const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--rp-c-text-1, #1a1a1a)',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background 0.2s ease',
    fontFamily: 'inherit',
    fontWeight: 400,
  };

  if (session) {
    const displayName = session.name && session.name !== session.userid
      ? session.name
      : session.userid;
    const fullDisplay = session.companyName
      ? `${session.companyName} · ${displayName}`
      : displayName;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '14px',
          color: 'var(--rp-c-text-1, #1a1a1a)',
          fontWeight: 500,
        }}>
          {fullDisplay}
        </span>
        <button
          onClick={handleLogout}
          title="退出登录"
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--rp-c-bg-alt, rgba(0,0,0,0.05))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          退出
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      title="登录"
      style={buttonStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--rp-c-bg-alt, rgba(0,0,0,0.05))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      登录
    </button>
  );
}

export default NavLoginButton;
