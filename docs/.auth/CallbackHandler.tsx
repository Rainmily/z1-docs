/**
 * 企业微信 OAuth 回调处理器
 * 路径：/auth/callback
 */

import React, { useEffect, useState } from 'react';

export default function CallbackHandler() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      setStatus('error');
      setErrorMsg('授权失败：未收到授权码');
      return;
    }

    let companyId = 'test-company';
    try {
      const s = JSON.parse(decodeURIComponent(state || '{}'));
      if (s?.companyId) companyId = s.companyId;
    } catch { /* ignore */ }

    const apiBase =
      (window as any).__ZSQK_AUTH_CONFIG__?.apiBase || 'http://localhost:3001';

    fetch(`${apiBase}/auth/code-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code, companyId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem('zsqk_wecom_session', data.token);
          const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
          sessionStorage.removeItem('auth_return_url');
          window.location.href = `${returnUrl}?auth_token=${encodeURIComponent(data.token)}`;
        } else {
          setStatus('error');
          setErrorMsg(data.error || '登录失败');
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(`网络错误: ${err.message}`);
      });
  }, []);

  const base: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  };
  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    textAlign: 'center',
  };

  if (status === 'loading') {
    return (
      <div style={base}>
        <div style={card}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1a1a1a' }}>
            正在验证身份
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
            请稍候，正在完成登录...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={base}>
      <div style={card}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1a1a1a' }}>
          登录失败
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#888' }}>
          {errorMsg}
        </p>
        <button
          onClick={() => (window.location.href = '/auth/login')}
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
