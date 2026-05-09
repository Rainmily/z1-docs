/**
 * 自定义主题 - 路由权限守卫 + 页面元信息展示
 */

import React from 'react';
import { Layout as BasicLayout } from '@rspress/core/theme-original';
import { NavLoginButton } from '../plugins/auth/NavLoginButton';
import AuthGuard from '../plugins/auth/AuthGuard';
import { PageMeta } from './PageMeta';

export function Layout() {
  return (
    <AuthGuard>
      <BasicLayout
        afterNavMenu={<NavLoginButton />}
        afterDocFooter={<PageMeta />}
      />
    </AuthGuard>
  );
}

export * from '@rspress/core/theme-original';
