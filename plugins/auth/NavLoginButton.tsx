/**
 * 导航栏登录按钮组件
 * 用于在 rspress 主题的 afterNavMenu 插槽中渲染
 */

import React, { useState, useEffect } from 'react';

interface SessionUser {
  userid: string;
  name?: string;
  avatar?: string;
  loginTime: number;
  expires: number;
}

export function NavLoginButton() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 加载 session
    try {
      const raw = localStorage.getItem('zsqk_wecom_session');
      if (raw) {
        const data = JSON.parse(raw);
        if (Date.now() <= data.expires) {
          setSession(data);
        } else {
          localStorage.removeItem('zsqk_wecom_session');
        }
      }
    } catch {
      // ignore
    }
    setIsReady(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('zsqk_wecom_session');
    setSession(null);
    window.location.reload();
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
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '14px',
          color: 'var(--rp-c-text-1, #1a1a1a)',
        }}>
          {session.name || session.userid}
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
