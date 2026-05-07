import React, { useState, useEffect, useCallback } from 'react';

interface Company {
  id: string;
  name: string;
  logo?: string;
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

// ── 登录按钮页面（单企业 / 选择企业后）───────────────────────
function LoginButtonPage({ company, apiBase, onBack, onError }: {
  company: Company;
  apiBase: string;
  onBack?: () => void;
  onError?: (message: string) => void;
}) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const handleLogin = useCallback(async () => {
    try {
      const endpoint = isMobile ? '/auth/oauth-url' : '/auth/qr-url';
      const res = await fetch(`${apiBase}${endpoint}?companyId=${encodeURIComponent(company.id)}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.url) {
        if (isMobile) {
          // 移动端：直接跳转
          window.location.href = data.url;
        } else {
          // PC端：新窗口打开扫码页
          window.open(data.url, '_blank', 'width=500,height=600,scrollbars=no');
        }
      } else {
        onError?.('获取登录链接失败，请稍后重试');
      }
    } catch {
      onError?.('无法连接认证服务，请检查网络');
    }
  }, [company.id, apiBase, isMobile, onError]);

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
        <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#888' }}>
          请使用企业微信账号登录访问
        </p>

        {/* 登录按钮 */}
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #1aad19, #07c160)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(26, 173, 25, 0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/>
          </svg>
          {isMobile ? '微信授权登录' : '企业微信扫码登录'}
        </button>

        {/* 返回按钮（多企业模式） */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              marginTop: '12px',
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

        <p style={{ marginTop: '20px', fontSize: '12px', color: '#ccc', lineHeight: 1.6 }}>
          {isMobile
            ? '点击后将跳转至企业微信进行身份验证'
            : '请使用企业微信 App 扫描二维码登录'}
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

  // 已选企业 → 显示登录按钮页
  const company = selectedCompany || companies[0];
  return (
    <LoginButtonPage
      company={company}
      apiBase={apiBase}
      onBack={multiTenant ? () => setSelectedCompany(null) : undefined}
      onError={onError}
    />
  );
}
