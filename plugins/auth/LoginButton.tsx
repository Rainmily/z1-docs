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
  const [isMobile, setIsMobile] = useState(false);

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

  // 响应式检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Base64 编码（支持 Unicode）
  const safeBtoa = (str: string): string => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  };

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
          // PC端：先设置登录状态为处理中，然后打开新窗口
          // 用户必须在点击回调中手动触发登录成功
          const loginId = Date.now().toString();
          sessionStorage.setItem('wecom_login_pending', loginId);

          // 打开新窗口（用户触发，不会被拦截）
          const popup = window.open(data.url, 'wecom-login', 'width=500,height=600,scrollbars=no');

          if (popup) {
            // 监听新窗口关闭，轮询 session
            const checkInterval = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkInterval);
                // 检查是否登录成功
                const session = localStorage.getItem('zsqk_wecom_session');
                if (session) {
                  const sessionData = JSON.parse(session);
                  if (sessionData.expires > Date.now()) {
                    onLoginSuccess?.(safeBtoa(JSON.stringify(sessionData)));
                  }
                }
                sessionStorage.removeItem('wecom_login_pending');
              }
            }, 500);
          } else {
            // Popup 被拦截，使用 iframe 或直接跳转
            onLoginError?.('请允许弹出窗口以完成登录');
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
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#333',
          padding: '6px 14px',
          borderRadius: '6px',
          fontSize: '13px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          border: '1px solid #e0e0e0',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.borderColor = '#1aad19';
          e.currentTarget.style.color = '#1aad19';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.color = '#333';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <span>登录</span>
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
