"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;exports.pluginAuth = pluginAuth; /**
 * 企业微信权限控制插件 - Rspress 插件接口
 *
 * 功能：
 * - PC端：内嵌企业微信二维码 → 用户扫码登录
 * - 移动端：跳转企业微信授权页 → APP内静默授权
 * - Session 管理（localStorage + 后端验证）
 */


























function pluginAuth(options = {}) {
  const {
    enabled = true,
    apiBase = '/auth-api',
    protectedPaths = [],
    publicPaths = [],
    showUserBadge = true,
    trustedDomain = 'https://docs.whohi.cn'
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
            `
        }]

      }
    }


  };
}var _default = exports.default =

pluginAuth; /* v9-77d2a608dfa4c812 */
