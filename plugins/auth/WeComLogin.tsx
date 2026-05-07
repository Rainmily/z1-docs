import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Company {
  id: string;
  name: string;
  logo?: string;
  corpId?: string;
  agentId?: string;
}

interface LoginPageProps {
  apiBase: string;
  onError?: (message: string) => void;
}

// ── 企业选择页面（多企业模式）────────────────────────────────
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
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1aad19';
                e.currentTarget.style.background = '#f0f9f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e8e8e8';
                e.currentTarget.style.background = '#f8f9fa';
              }}
            >
              {/* 企业 Logo */}
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
                  overflow: 'hidden',
                }}
              >
                {company.logo ? (
                  <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  company.name.charAt(0)
                )}
              </div>

              {/* 企业名称 */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#222', marginBottom: '2px' }}>
                  {company.name}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>
                  使用企业微信账号登录
                </div>
              </div>

              {/* 箭头 */}
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

// ── 登录面板页面 ─────────────────────────────────────────────
function LoginPanelPage({ company, apiBase, onBack }: {
  company: Company;
  apiBase: string;
  onBack?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wwLoginRef = useRef<any>(null);

  // 加载企业微信登录 SDK 并初始化登录面板
  useEffect(() => {
    if (!company.corpId || !company.agentId) {
      return;
    }

    // 清理旧的登录面板
    if (wwLoginRef.current) {
      wwLoginRef.current.unmount?.();
      wwLoginRef.current = null;
    }

    const script = document.createElement('script');
    script.src = 'https://work.weixin.qq.com/wwopen/sso/ww_login_mini_programs.js';
    script.async = true;

    script.onload = () => {
      const ww = (window as any).wx;
      if (ww && containerRef.current) {
        // 清理容器内容
        containerRef.current.innerHTML = '';

        try {
          const loginObj = ww.createWWLoginPanel({
            el: containerRef.current,
            params: {
              login_type: 'CorpApp',
              appid: company.corpId,
              agentid: company.agentId,
              redirect_uri: `${apiBase}/auth/callback`,
              state: JSON.stringify({ companyId: company.id }),
              redirect_type: 'callback',
            },
            onLoginSuccess: async ({ code }: { code: string }) => {
              console.log('[WWLogin] Login success, code:', code);
              // 将 code 发送到后端完成登录
              try {
                const res = await fetch(`${apiBase}/auth/code-login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ code, companyId: company.id }),
                });
                const data = await res.json();
                if (data.token) {
                  // 登录成功，跳转到成功页
                  window.location.href = `/auth/success?token=${encodeURIComponent(data.token)}`;
                } else {
                  console.error('[WWLogin] No token returned:', data);
                }
              } catch (err) {
                console.error('[WWLogin] Login failed:', err);
              }
            },
            onLoginFail: (err: any) => {
              console.error('[WWLogin] Login failed:', err);
            },
          });
          wwLoginRef.current = loginObj;
        } catch (err) {
          console.error('[WWLogin] Failed to create login panel:', err);
        }
      }
    };

    document.body.appendChild(script);

    return () => {
      if (wwLoginRef.current) {
        wwLoginRef.current.unmount?.();
        wwLoginRef.current = null;
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
            <img src={company.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
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

        {/* 企业微信登录面板容器 */}
        <div
          ref={containerRef}
          style={{ display: 'flex', justifyContent: 'center', minHeight: '300px' }}
        />

        {/* 返回按钮（多企业模式） */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              marginTop: '20px',
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ‹ 返回选择企业
          </button>
        )}

        <p style={{ marginTop: '16px', fontSize: '12px', color: '#ccc', lineHeight: 1.6 }}>
          请使用企业微信扫码登录
          <br />
          仅限企业内部成员访问
        </p>
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
        © 2026 晋城市掌上乾坤网络科技有限公司
      </p>
    </div>
  );
}

// ── 主组件 ─────────────────────────────────────────────────────
export default function WeComLogin({ apiBase, onError }: LoginPageProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [multiTenant, setMultiTenant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载可用企业列表
  useEffect(() => {
    fetch(`${apiBase}/auth/companies`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data.companies || []);
        setMultiTenant(data.multiTenant || false);

        // 单企业模式：自动进入登录页
        if (!data.multiTenant && data.companies?.length === 1) {
          setSelectedCompany(data.companies[0]);
        }
      })
      .catch(() => {
        // 降级：显示一个默认选项
        setCompanies([{ id: 'default', name: '企业微信登录' }]);
      })
      .finally(() => setIsLoading(false));
  }, [apiBase]);

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

  // 多企业模式 + 未选企业 → 显示企业选择页
  if (multiTenant && !selectedCompany) {
    return <CompanySelector companies={companies} onSelect={setSelectedCompany} />;
  }

  // 已选企业 → 显示登录面板页
  const company = selectedCompany || companies[0];

  // 防御性检查：没有可用企业
  if (!company?.id) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#666' }}>
        <span>正在加载企业信息...</span>
      </div>
    );
  }

  return (
    <LoginPanelPage
      company={company}
      apiBase={apiBase}
      onBack={multiTenant ? () => setSelectedCompany(null) : undefined}
    />
  );
}