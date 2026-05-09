/**
 * WeComLoginWrapper - 独立的企业微信登录组件包装器
 * 供页面直接使用，使用稳定的 WeComLoginVanilla 组件
 */

import React from 'react';
import WeComLoginFinal from './WeComLoginVanilla';

export default function WeComLoginWrapper() {
  const apiBase =
    typeof window !== 'undefined'
      ? (window as any).__ZSQK_AUTH_CONFIG__?.apiBase || '/auth-api'
      : '/auth-api';

  return <WeComLoginFinal apiBase={apiBase} />;
}
