/**
 * 企业微信登录 - 最终稳定版本
 * 修复内容：
 * 1. fetch 加 8 秒超时兜底，避免无限 loading
 * 2. 正确处理登录成功后的状态更新
 * 3. postMessage 和 URL callback 双通道兼容
 */
import React, { useState, useEffect, useRef } from 'react';
import { safeAtob } from './base64Utf8';

interface Company {
  id: string;
  name: string;
  logo?: string;
  corpId?: string;
  agentId?: string;
}

// 带超时的 fetch
async function fetchWithTimeout(url: string, options?: RequestInit, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export default function WeComLoginFinal({ apiBase }: { apiBase: string }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [returnUrl, setReturnUrl] = useState('/');
  const initializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 从 URL 参数中读取 token（扫码成功回调后携带）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('auth_token');
    if (token) {
      const url = sessionStorage.getItem('auth_return_url') || '/';
      sessionStorage.removeItem('auth_return_url');
      setReturnUrl(url);
      // 保存 token 到 localStorage
      try {
        const decoded = JSON.parse(safeAtob(token));
        decoded.expires = Date.now() + 8 * 60 * 60 * 1000;
        localStorage.setItem('zsqk_wecom_session', JSON.stringify(decoded));
      } catch {}
      // 显示成功画面，等 React 渲染后再跳转
      setLoginSuccess(true);
    }
  }, []);

  // 登录成功 1.5 秒后重定向
  useEffect(() => {
    if (!loginSuccess) return;
    const timer = setTimeout(() => {
      window.location.href = returnUrl;
    }, 1500);
    return () => clearTimeout(timer);
  }, [loginSuccess, returnUrl]);

  // 获取企业列表（带超时）
  useEffect(() => {
    fetchWithTimeout(`${apiBase}/auth/companies`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const companies: Company[] = data.companies || [];
        if (companies.length > 0) {
          setCompany(companies[0]);
        } else {
          setFetchError(true);
        }
      })
      .catch(() => {
        setFetchError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [apiBase]);

  // 初始化 SDK（当 company 准备就绪时）
  useEffect(() => {
    if (!company || initializedRef.current) return;
    initializedRef.current = true;

    const script = document.createElement('script');
    script.src = 'https://wwcdn.weixin.qq.com/node/wework/wwopen/js/wwLogin-1.2.7.js';
    script.async = true;

    script.onload = () => {
      const WwLogin = (window as any).WwLogin;
      if (!WwLogin) {
        setSdkError(true);
        return;
      }
      // 等 DOM 更新
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!containerRef.current) {
            setSdkError(true);
            return;
          }
          try {
            new WwLogin({
              id: 'wecom-login-container',
              appid: company.corpId,
              agentid: company.agentId,
              redirect_uri: encodeURIComponent(`${window.location.origin}/auth/callback`),
              state: encodeURIComponent(JSON.stringify({ companyId: company.id })),
              lang: 'zh',
            });
            setSdkReady(true);
          } catch (err) {
            console.error('[WeCom] SDK 初始化失败:', err);
            setSdkError(true);
          }
        });
      });
    };

    script.onerror = () => {
      console.error('[WeCom] SDK 加载失败');
      setSdkError(true);
    };

    document.body.appendChild(script);
  }, [company, apiBase]);

  // 处理 postMessage 扫码登录回调
  useEffect(() => {
    // 保存登录成功后返回 URL
    sessionStorage.setItem('auth_return_url', window.location.pathname);

    let wecomSdkReady = false;

    // ── 等待 SDK iframe 加载完成后再发 postMessage 回复 ──
    const sdkContainer = document.getElementById('wecom-login-container');
    if (sdkContainer) {
      const iframe = sdkContainer.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        // 等 iframe 加载完成
        iframe.addEventListener('load', () => {
          console.log('[WeCom] SDK iframe 已加载，发送 usePostMessage');
          wecomSdkReady = true;
          iframe.contentWindow?.postMessage('usePostMessage', '*');
        });
        // 如果已经加载完成（load 事件已过），直接发
        if (iframe.contentDocument?.readyState === 'complete') {
          wecomSdkReady = true;
          iframe.contentWindow?.postMessage('usePostMessage', '*');
        }
      }
    }

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      const data = event.data;

      // ── 回复 SDK 探测消息，启用 postMessage 通道 ──
      if (data === 'ask_usePostMessage') {
        console.log('[WeCom] 收到 SDK 探测，回复 usePostMessage');
        const iframe = document.querySelector('#wecom-login-container iframe') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          wecomSdkReady = true;
          iframe.contentWindow.postMessage('usePostMessage', '*');
        } else {
          // iframe 还没加载，等一下再发
          setTimeout(() => {
            const fi = document.querySelector('#wecom-login-container iframe') as HTMLIFrameElement;
            fi?.contentWindow?.postMessage('usePostMessage', '*');
          }, 1000);
        }
        return;
      }

      // ── 收到真实的 auth code ──
      if (!data?.code) return;
      window.removeEventListener('message', handleMessage);
      console.log('[WeCom] 扫码成功, code:', data.code);

      fetchWithTimeout(`${apiBase}/auth/code-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: data.code, companyId: company?.id }),
      }, 8000)
        .then(res => res.json())
        .then(result => {
          console.log('[WeCom] 后端返回:', JSON.stringify(result));
          if (result.token) {
            const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
            sessionStorage.removeItem('auth_return_url');
            // 保存到 localStorage（AuthGuard 从这里读取）
            try {
              const decoded = JSON.parse(safeAtob(result.token));
              decoded.expires = Date.now() + 8 * 60 * 60 * 1000;
              localStorage.setItem('zsqk_wecom_session', JSON.stringify(decoded));
            } catch {}
            window.location.href = `${returnUrl}?auth_token=${encodeURIComponent(result.token)}`;
          } else {
            console.error('[WeCom] 登录失败:', result.error);
          }
        })
        .catch(err => console.error('[WeCom] 登录请求失败:', err));
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [apiBase, company]);

  // ─── 渲染 ────────────────────────────────────────────────────────────────

  // 登录成功 — 显示成功画面，1.5 秒后跳转到目标页
  if (loginSuccess) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '48px 40px', width: '100%',
          maxWidth: '400px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', color: '#1a1a1a', fontWeight: 600 }}>
            登录成功
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#888' }}>
            正在跳转到目标页面...
          </p>
          <div style={{ marginTop: '16px' }}>
            <div style={{
              width: '40px', height: '40px', border: '3px solid #e0e0e0',
              borderTopColor: '#1aad19', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto',
            }} />
          </div>
        </div>
      </div>
    );
  }

  // 企业信息加载失败
  if (fetchError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '48px 40px', width: '100%',
          maxWidth: '400px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: '#c00' }}>无法加载企业信息</h2>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#888' }}>
            请检查网络连接后
            <button
              onClick={() => window.location.reload()}
              style={{
                marginLeft: '8px', padding: '4px 12px', background: '#1aad19', color: '#fff',
                border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
              }}
            >刷新重试</button>
          </p>
        </div>
      </div>
    );
  }

  // 正在加载企业信息
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '48px 40px', width: '100%',
          maxWidth: '400px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1a1a1a' }}>正在加载...</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>请稍候</p>
        </div>
      </div>
    );
  }

  // 主登录界面
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      }}
    >
      {/* 返回链接 */}
      <a
        href="/"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ← 返回首页
      </a>

      <div
        style={{
          background: '#fff', borderRadius: '16px', padding: '40px 36px', width: '100%',
          maxWidth: '500px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)', textAlign: 'center',
        }}
      >
        <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#1a1a1a', fontWeight: 600 }}>
          企业微信登录
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#888' }}>
          请使用企业微信扫码登录
        </p>

        {/* SDK 容器 */}
        <div
          id="wecom-login-container"
          ref={containerRef}
          style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />

        {/* SDK 加载中 */}
        {!sdkReady && !sdkError && (
          <div style={{
            textAlign: 'center', color: '#999',
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', width: '100%',
          }}>
            <div style={{ fontSize: '14px' }}>正在加载登录组件...</div>
          </div>
        )}

        {/* SDK 加载失败 */}
        {sdkError && (
          <div style={{
            textAlign: 'center', color: '#999',
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', width: '100%',
          }}>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>登录组件加载失败</p>
            <p style={{ fontSize: '12px', color: '#ccc' }}>请检查网络后刷新重试</p>
          </div>
        )}

        <p style={{ marginTop: '16px', fontSize: '12px', color: '#ccc', lineHeight: 1.6 }}>
          仅限企业内部成员访问
        </p>
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
        © 2026 晋城市掌上乾坤网络科技有限公司
      </p>
    </div>
  );
}
