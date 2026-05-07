/**
 * LoginButton - 主动登录按钮组件
 *
 * 用于在公开页面显示登录入口
 */

import React, { useState, useEffect } from 'react';

interface Company {
  id: string;
  name: string;
  logo?: string;
}

interface LoginButtonProps {
  apiBase: string;
  onLoginSuccess?: (token: string) => void;
  onLoginError?: (message: string) => void;
}

export default function LoginButton({ apiBase, onLoginSuccess, onLoginError }: LoginButtonProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    // 动态加载企业信息
    fetch(`${apiBase}/auth/companies`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.companies?.length > 0) {
          setCompanies(data.companies);
        }
      })
      .catch(() => {
        // 忽略错误
      });
  }, [apiBase]);

  const handleLogin = async (company: Company) => {
    setIsLoading(true);
    try {
      const endpoint = isMobile ? '/auth/oauth-url' : '/auth/qr-url';
      const res = await fetch(
        `${apiBase}${endpoint}?companyId=${encodeURIComponent(company.id)}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (data.url) {
        if (isMobile) {
          window.location.href = data.url;
        } else {
          // PC端打开新窗口
          const popup = window.open(data.url, 'wecom-login', 'width=500,height=600,scrollbars=no');
          // 监听新窗口关闭，轮询 session
          if (popup) {
            const checkInterval = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkInterval);
                // 检查是否登录成功
                const session = localStorage.getItem('zsqk_wecom_session');
                if (session) {
                  const sessionData = JSON.parse(session);
                  if (sessionData.expires > Date.now()) {
                    onLoginSuccess?.(btoa(JSON.stringify(sessionData)));
                  }
                }
              }
            }, 500);
          }
        }
      } else {
        onLoginError?.('获取登录链接失败');
      }
    } catch {
      onLoginError?.('无法连接认证服务');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          zIndex: 9998,
          background: '#1aad19',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontFamily: 'system-ui, sans-serif',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(26, 173, 25, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '16px' }}>💬</span>
        <span>企业微信登录</span>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '32px',
          width: '360px',
          maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>选择登录方式</h3>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
            }}
          >
            ×
          </button>
        </div>

        {companies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ color: '#666', marginBottom: '16px' }}>正在加载...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleLogin(company)}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: isLoading ? '#f5f5f5' : '#f8f8f8',
                  border: '1px solid #eee',
                  borderRadius: '10px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: '#333',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1aad19, #07c160)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    company.name.charAt(0)
                  )}
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{company.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>使用企业微信账号登录</div>
                </div>
                <span style={{ color: '#ccc', fontSize: '18px' }}>›</span>
              </button>
            ))}
          </div>
        )}

        <p style={{ fontSize: '12px', color: '#ccc', textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>
          仅限企业内部成员访问
        </p>
      </div>
    </div>
  );
}
