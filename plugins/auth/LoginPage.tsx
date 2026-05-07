import React from 'react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => boolean;
  error?: string;
}

export default function LoginPage({ onLogin, error }: LoginPageProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    onLogin(username, password);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '24px',
            fontSize: '20px',
            color: '#333',
          }}
        >
          掌上乾坤 - 授权访问
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                color: '#666',
              }}
            >
              用户名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="请输入用户名"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                color: '#666',
              }}
            >
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div
              style={{
                color: '#e74c3c',
                fontSize: '13px',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '15px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            登录
          </button>
        </form>

        <p
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#999',
          }}
        >
          仅限授权用户访问
        </p>
      </div>
    </div>
  );
}
