/**
 * 企业微信登录页面
 * 独立的登录页面，通过 /auth/login 路由访问
 */

import React, { useState, useEffect, useRef } from 'react';

interface Company {
  id: string;
  name: string;
  logo?: string;
  corpId?: string;
  agentId?: string;
}

interface LoginPageProps {
  apiBase: string;
  redirectUri?: string;
}

function LoginPanel({ company, apiBase }: { company: Company; apiBase: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loginRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !company.corpId || !company.agentId) {
      return;
    }

    if (loginRef.current) {
      loginRef.current.unmount?.();
    }

    const script = document.createElement('script');
    script.src = 'https://work.weixin.qq.com/wwopen/sso/ww_login_mini_programs.js';
    script.async = true;

    script.onload = () => {
      const ww = (window as any).wx;
      if (!ww || !containerRef.current) return;

      try {
        loginRef.current = ww.createWWLoginPanel({
          el: containerRef.current,
          params: {
            login_type: 'CorpApp',
            appid: company.corpId,
            agentid: company.agentId,
            redirect_uri: `${window.location.origin}/auth/callback`,
            state: JSON.stringify({ companyId: company.id }),
            redirect_type: 'callback',
          },
          onLoginSuccess: async ({ code }: { code: string }) => {
            console.log('[WWLogin] 登录成功, code:', code);
            try {
              const res = await fetch(`${apiBase}/auth/code-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code, companyId: company.id }),
              });
              const data = await res.json();
              if (data.token) {
                // 登录成功后跳转回首页或指定页面
                const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
                sessionStorage.removeItem('auth_return_url');
                window.location.href = `${returnUrl}?auth_token=${encodeURIComponent(data.token)}`;
              }
            } catch (err) {
              console.error('[WWLogin] 登录请求失败:', err);
            }
          },
          onLoginFail: (err: any) => {
            console.error('[WWLogin] 登录失败:', err);
          },
        });
      } catch (err) {
        console.error('[WWLogin] 创建登录面板失败:', err);
      }
    };

    document.body.appendChild(script);

    return () => {
      if (loginRef.current) {
        loginRef.current.unmount?.();
        loginRef.current = null;
      }
    };
  }, [company, apiBase]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
        }}
      >
        {/* 企业 Logo */}
        <div
          style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #1aad19, #07c160)',
            borderRadius: '16px',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
          }}
        >
          {company.logo ? (
            <img
              src={company.logo}
              alt={company.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
            />
          ) : (
            company.name.charAt(0)
          )}
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#1a1a1a', fontWeight: 600 }}>
          {company.name}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#888' }}>
          请使用企业微信扫码登录
        </p>

        {/* 登录面板容器 */}
        <div ref={containerRef} style={{ minHeight: '300px' }} />

        <p style={{ marginTop: '16px', fontSize: '12px', color: '#ccc', lineHeight: 1.6 }}>
          请使用企业微信扫码登录
          <br />
          仅限企业内部成员访问
        </p>

        {/* 版本标记 */}
        <p style={{ marginTop: '12px', fontSize: '10px', color: '#ddd' }}>
          v{new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')}
        </p>
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
        © 2026 晋城市掌上乾坤网络科技有限公司
      </p>
    </div>
  );
}

function CompanySelector({ companies, onSelect }: {
  companies: Company[];
  onSelect: (company: Company) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #1aad19, #07c160)',
            borderRadius: '16px',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
          }}
        >
          🏢
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#1a1a1a', fontWeight: 600 }}>
          选择您的企业
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#888' }}>
          请选择您所属的企业以继续访问
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => onSelect(company)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: '#f8f9fa',
                border: '1.5px solid #e8e8e8',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1aad19, #07c160)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                }}
              >
                {company.logo ? (
                  <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  company.name.charAt(0)
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#222', marginBottom: '2px' }}>
                  {company.name}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>
                  使用企业微信账号登录
                </div>
              </div>
              <span style={{ color: '#ccc', fontSize: '18px' }}>›</span>
            </button>
          ))}
        </div>

        <p style={{ marginTop: '24px', fontSize: '12px', color: '#ccc' }}>
          仅限企业内部成员访问
        </p>
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
        © 2026 晋城市掌上乾坤网络科技有限公司
      </p>
    </div>
  );
}

export default function WeComLogin({ apiBase }: LoginPageProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [multiTenant, setMultiTenant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 保存当前页面 URL，登录成功后返回
    sessionStorage.setItem('auth_return_url', window.location.pathname);

    fetch(`${apiBase}/auth/companies`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data.companies || []);
        setMultiTenant(data.multiTenant || false);
        if (!data.multiTenant && data.companies?.length === 1) {
          setSelectedCompany(data.companies[0]);
        }
      })
      .catch(() => {
        setCompanies([{ id: 'default', name: '企业微信登录' }]);
      })
      .finally(() => setIsLoading(false));
  }, [apiBase]);

  // SSR 时直接返回登录面板，避免 hydration 不一致
  if (!isMounted) {
    return <LoginPanel company={{ id: 'default', name: '企业微信' }} apiBase={apiBase} />;
  }

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
          background: '#f5f5f5',
        }}
      >
        <span>正在加载...</span>
      </div>
    );
  }

  if (multiTenant && !selectedCompany) {
    return <CompanySelector companies={companies} onSelect={setSelectedCompany} />;
  }

  const company = selectedCompany || companies[0];

  if (!company?.id) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span>正在加载企业信息...</span>
      </div>
    );
  }

  return <LoginPanel company={company} apiBase={apiBase} />;
}