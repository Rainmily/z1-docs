/**
 * 自定义主题 - 在导航栏中添加登录按钮
 */

import React from 'react';
import { Layout as BasicLayout } from '@rspress/core/theme-original';
import { NavLoginButton } from '../plugins/auth/NavLoginButton';

export function Layout() {
  return (
    <BasicLayout
      afterNavMenu={<NavLoginButton />}
    />
  );
}

export * from '@rspress/core/theme-original';
