# 掌上乾坤文档站 - 权限控制插件

## 快速开始

### 1. 安装

插件位于 `plugins/auth/` 目录下，无需额外安装 npm 包。

### 2. 配置

在 `rspress.config.ts` 中引入并配置：

```ts
import { pluginAuth } from './plugins/auth';

export default defineConfig({
  plugins: [
    pluginAuth({
      enabled: true,

      // 需要登录才能访问的路径
      protectedPaths: ['/z1/'],

      // 公开路径（即使在 protectedPaths 内也不需要登录）
      publicPaths: ['/', '/solution/', '/cases/'],

      // Session 有效期（毫秒）
      sessionDuration: 8 * 60 * 60 * 1000,

      // 右上角显示用户徽章
      showUserBadge: true,

      // 用户列表
      users: [
        { username: 'admin', password: 'admin123', roles: ['admin'] },
        { username: 'staff', password: 'staff123', roles: ['staff'] },
      ],
    }),
  ],
});
```

### 3. 运行

```bash
npm run dev    # 开发环境
npm run build  # 生产构建
```

未登录用户访问受保护页面时，会被重定向到登录页面。

---

## 用户配置方式

### 方式一：内联配置（简单场景）

直接在 `rspress.config.ts` 中配置 `users` 数组。

### 方式二：外部配置文件（推荐）

创建 `auth-users.js` 文件：

```js
module.exports = {
  users: [
    { username: 'admin', password: 'admin123', roles: ['admin'] },
    { username: 'staff', password: 'staff123', roles: ['staff'] },
  ],
};
```

然后在配置中引用：

```ts
pluginAuth({
  configFile: './auth-users.js',
})
```

---

## 权限模式说明

| 场景 | protectedPaths | publicPaths | 效果 |
|------|--------------|-------------|------|
| 保护全部站点 | `[]`（空） | `['/login/']` | 除登录页外全部需要登录 |
| 保护特定模块 | `['/z1/', '/product/']` | `['/', '/about/']` | 仅指定模块需要登录 |
| 关闭权限 | `enabled: false` | - | 所有页面公开访问 |

---

## 安全性说明

⚠️ **当前方案为客户端校验**，适用于以下场景：
- 内网部署的文档站
- 对安全性要求不高的内部资料站
- 开发/演示环境

如需更高安全性，建议：
1. **结合 Nginx 认证**：在 Nginx 层添加 `auth_basic`
2. **接入 Auth0 / Supabase**：使用专业第三方身份服务
3. **服务端渲染校验**：使用 Next.js 等 SSR 框架替代方案

---

## 目录结构

```
plugins/auth/
├── index.ts        # 插件主入口
├── AuthGuard.tsx   # 权限守卫组件（React）
├── LoginPage.tsx   # 登录页面组件
└── README.md       # 本文档
```
