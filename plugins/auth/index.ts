/**
 * 企业微信权限控制插件 - Rspress 插件接口
 *
 * 功能：
 * - PC端：内嵌企业微信二维码 → 用户扫码登录
 * - 移动端：跳转企业微信授权页 → APP内静默授权
 * - Session 管理（localStorage + 后端验证）
 */

import type { RspressPlugin } from '@rspress/shared';

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
    apiBase = '/auth-api',
    protectedPaths = [],
    publicPaths = [],
    showUserBadge = true,
    trustedDomain = 'https://docs.whohi.cn',
  } = options;

  return {
    name: 'plugin-auth',

    // 向客户端运行时注入配置（直接写 script 标签，确保在 React 加载前就执行）
    builderConfig: {
      source: {},
      html: {
        tags: [
          {
            tag: 'script',
            attrs: { 'data-inline': true },
            children: `
window.__ZSQK_AUTH_CONFIG__ = {
  enabled: ${JSON.stringify(enabled)},
  apiBase: ${JSON.stringify(apiBase)},
  protectedPaths: ${JSON.stringify(protectedPaths)},
  publicPaths: ${JSON.stringify(publicPaths)},
  showUserBadge: ${JSON.stringify(showUserBadge)},
  trustedDomain: ${JSON.stringify(trustedDomain)},
};
// 企业微信 SDK postMessage 拦截：在 React 加载前就设置监听器
(function() {
  var orgAdd = window.addEventListener.bind(window);
  var sdkReplied = false;
  window.addEventListener('message', function(e) {
    var d = e.data;
    if (typeof d !== 'string') return;
    if (d === 'ask_usePostMessage' && !sdkReplied) {
      sdkReplied = true;
      // 稍等 iframe 加载完成后再发回复
      var iframe = document.getElementById('wecom-login-container');
      if (iframe) {
        var child = iframe.querySelector('iframe');
        if (child && child.contentWindow) {
          child.contentWindow.postMessage('usePostMessage', '*');
          return;
        }
      }
      // iframe 还没创建，等一下
      var tries = 0;
      var interval = setInterval(function() {
        tries++;
        var cont = document.getElementById('wecom-login-container');
        var frm = cont ? cont.querySelector('iframe') : null;
        if (frm && frm.contentWindow) {
          clearInterval(interval);
          frm.contentWindow.postMessage('usePostMessage', '*');
        } else if (tries > 50) {
          clearInterval(interval);
        }
      }, 100);
    }
  });
})();
            `,
          },
        ],
      },
    },


  };
}

export default pluginAuth;
