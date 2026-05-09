/**
 * 自定义主题 - 在导航栏中添加登录按钮 + 路由权限守卫
 */

import React from 'react';
import { Layout as BasicLayout } from '@rspress/core/theme-original';
import { NavLoginButton } from '../plugins/auth/NavLoginButton';
import AuthGuard from '../plugins/auth/AuthGuard';

export function Layout() {
  return (
    <AuthGuard>
      <BasicLayout
        afterNavMenu={<NavLoginButton />}
      />
    </AuthGuard>
  );
}

export * from '@rspress/core/theme-original';
