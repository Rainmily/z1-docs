/**
 * 企业微信权限控制插件 - Rspress 插件接口
 *
 * 功能：
 * - PC端：内嵌企业微信二维码 → 用户扫码登录
 * - 移动端：跳转企业微信授权页 → APP内静默授权
 * - Session 管理（localStorage + 后端验证）
 */

import type { RspressPlugin } from '@rspress/shared';
import * as path from 'node:path';

export interface WeComAuthPluginOptions {
  /** 是否启用权限控制，默认 true */
  enabled?: boolean;

  /** 后端认证服务地址（末尾不带斜杠） */
  apiBase?: string;

  /** 需要登录才能访问的路由前缀 */
  protectedPaths?: string[];

  /** 公开访问的路由前缀（优先级更高） */
  publicPaths?: string[];

  /** 是否显示右上角用户徽章 */
  showUserBadge?: boolean;

  /**
   * 可信域名（用于生成企业微信回调地址）
   * 生产环境请填写实际域名，如 https://docs.zsqk.com
   */
  trustedDomain?: string;
}

export function pluginAuth(options: WeComAuthPluginOptions = {}): RspressPlugin {
  const {
    enabled = true,
    apiBase = 'http://localhost:3001',
    protectedPaths = [],
    publicPaths = [],
    showUserBadge = false,
    trustedDomain = 'http://localhost:3001',
  } = options;

  // AuthGuard 组件路径
  const authGuardPath = path.resolve(__dirname, 'AuthGuard.tsx');

  return {
    name: 'plugin-auth',

    // 注入全局守卫组件（每个页面加载时执行）
    globalUIComponents: [[authGuardPath, { name: 'AuthGuard' }]],

    // 向客户端运行时注入配置
    addRuntimeModules() {
      return {
        // 虚拟模块：在客户端初始化时设置 window.__ZSQK_AUTH_CONFIG__
        'virtual-auth-init': `
          (function() {
            window.__ZSQK_AUTH_CONFIG__ = {
              enabled: ${JSON.stringify(enabled)},
              apiBase: ${JSON.stringify(apiBase)},
              protectedPaths: ${JSON.stringify(protectedPaths)},
              publicPaths: ${JSON.stringify(publicPaths)},
              showUserBadge: ${JSON.stringify(showUserBadge)},
              trustedDomain: ${JSON.stringify(trustedDomain)},
            };
          })();
        `,
      };
    },

    // 扩展构建配置
    builderConfig: {
      source: {
        define: {
          // 环境变量（供前端使用）
          __AUTH_API_BASE__: JSON.stringify(apiBase),
        },
      },
    },
  };
}

export default pluginAuth;
