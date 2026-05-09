import { defineConfig } from '@rspress/core';
import { pluginAuth } from './plugins/auth';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 生产用 /auth-api（nginx 已代理到 Express）；本地开发用 localhost:3001
const apiBase = process.env.AUTH_API_BASE || '/auth-api';

export default defineConfig({
  root: 'docs',
  themeDir: path.join(__dirname, 'theme'),
  title: '掌上乾坤-赋能中心',
  description: '10年深耕，服务5000+门店。专注手机连锁门店管理系统，从进销存到会员营销，从单店到连锁全覆盖。',

  // 禁用 SSR，避免 hydration 不匹配问题
  ssg: false,

  // ── 页面权限控制（企业微信登录）────────────────────────────────
  plugins: [
    pluginAuth({
      // enabled: true, // 设为 false 可临时关闭权限控制
      enabled: true,

      // 认证服务地址（通过环境变量 AUTH_API_BASE 覆盖，默认开发用 localhost:3001）
      ...(process.env.AUTH_API_BASE ? { apiBase: process.env.AUTH_API_BASE } : {}),

      // 保护区域：以下路径需要登录才能访问
      protectedPaths: [
        '/product/',    // 产品功能
        '/z1/',         // Z1 操作手册
        '/resources/',  // 资源中心
        '/changelog/',  // 更新日志
      ],

      // 公开路径：不需要登录即可访问
      publicPaths: [
        '/',              // 首页
        '/solution/',     // 解决方案
        '/cases/',        // 成功案例
        '/news/',         // 行业资讯
        '/auth/login',    // 登录页面
        '/auth/callback', // OAuth 回调页面
        '/auth/refresh-session', // 强制刷新 session
      ],

      // 右上角显示已登录用户徽章
      showUserBadge: true,

      // 生产环境请填写实际域名
      trustedDomain: 'https://docs.whohi.cn',
    }),
  ],
  themeConfig: {

    logo: {
      image: '/logo.jpg',
      text: '掌上乾坤',
    },
    logoText: '掌上乾坤',
    nav: [
      { text: '官网', link: 'https://www.zsqk.com.cn/', target: '_blank' },
      { text: '解决方案', link: '/solution/' },
      { text: '成功案例', link: '/cases/' },
      { text: '行业资讯', link: '/news/' },
      { text: '产品功能', link: '/product/' },
      { text: 'Z1操作手册', link: '/z1/' },
      { text: '资源中心', link: '/resources/' },
      { text: '更新日志', link: '/changelog/' },
    ],
    sidebar: {
      '/product/': [
        {
          text: '产品功能',
          items: [
            { text: '智能收银 POS', link: '/product/pos' },
            { text: '库存管理', link: '/product/inventory' },
            { text: '会员营销', link: '/product/member' },
            { text: '数据报表', link: '/product/report' },
            { text: '员工管理', link: '/product/staff' },
            { text: '串码管理', link: '/product/serial' },
            { text: 'ASA设计', link: '/product/asa-design' },
          ],
        },
      ],
      '/solution/': [
        {
          text: '解决方案',
          items: [
            { text: '单店方案', link: '/solution/single' },
            { text: '连锁方案', link: '/solution/chain' },
            { text: '品牌方案', link: '/solution/brand' },
            { text: '运营商方案', link: '/solution/carrier' },
          ],
        },
      ],
      '/cases/': [
        {
          text: '成功案例',
          items: [
            { text: '案例列表', link: '/cases/' },
          ],
        },
      ],
      '/resources/': [
        {
          text: '资源中心',
          items: [
            { text: '资源中心', link: '/resources/' },
            { text: '快速入门', link: '/resources/getting-started' },
            { text: '视频教程', link: '/resources/videos' },
            { text: '行业报告', link: '/resources/reports' },
          ],
        },
      ],
      '/news/': [
        {
          text: '行业资讯',
          collapsed: false,
          items: [
            { text: '行业资讯', link: '/news/' },
            { text: '2026年04月30日', link: '/news/2026-04-30-industry-news' },
            { text: '2026年05月07日', link: '/news/2026-05-07-industry-news' },
            { text: '2026年05月08日', link: '/news/2026-05-08-industry-news' },
            { text: '2026年05月09日', link: '/news/2026-05-09-industry-news' },
          ],
        },
      ],
      '/changelog/': [
        {
          text: '更新日志',
          items: [
            { text: '更新日志', link: '/changelog/' },
          ],
        },
      ],
      '/z1/': [
        {
          text: 'Z1操作手册',
          items: [
            { text: 'Z1操作手册', link: '/z1/' },
          ],
        },
        {
          text: '基础入门',
          items: [
            { text: 'Z1使用说明书', link: '/z1/basics/' },
          ],
        },
        {
          text: '会员模块',
          items: [
            { text: '会员业务', link: '/z1/member-guide/' },
            { text: '储值功能', link: '/z1/member-guide/stored-value' },
            { text: '会员功能', link: '/z1/member-guide/member-function' },
            { text: '会员生日关怀', link: '/z1/member-guide/birthday-care' },
            { text: '会员回访', link: '/z1/member-guide/member-return-visit' },
            { text: '会员总览', link: '/z1/member-guide/member-overview' },
            { text: '专属导购', link: '/z1/member-guide/personal-shopper' },
            { text: '会员查询', link: '/z1/member-guide/member-query' },
            { text: '付费会员', link: '/z1/member-guide/vip-member' },
            { text: '会员定时提醒', link: '/z1/member-guide/member-reminder' },
            { text: '会员行为', link: '/z1/member-guide/member-behavior' },
            { text: '会员数据驾驶舱', link: '/z1/member-guide/member-dashboard' },
          ],
        },
        {
          text: '销售模块',
          items: [
            { text: '销售模块', link: '/z1/sales-guide/' },
            { text: '销售订单', link: '/z1/sales-guide/sales-order' },
            { text: '预订订单', link: '/z1/sales-guide/reservation-order' },
            { text: '赠品功能', link: '/z1/sales-guide/gift-function' },
            { text: '退货退款', link: '/z1/sales-guide/return-refund' },
            { text: '以旧换新', link: '/z1/sales-guide/trade-in' },
            { text: '优惠审批流程', link: '/z1/sales-guide/discount-approval' },
            { text: '商品利润分析', link: '/z1/sales-guide/profit-analysis' },
          ],
        },
        {
          text: '库存模块',
          items: [
            { text: '库存模块', link: '/z1/inventory-guide/' },
            { text: '调拨单', link: '/z1/inventory-guide/transfer-order' },
            { text: '返厂维修', link: '/z1/inventory-guide/repair-return' },
            { text: '序列号追踪', link: '/z1/inventory-guide/serial-trace' },
            { text: '快捷分货', link: '/z1/inventory-guide/quick-distribution' },
            { text: '智能库存', link: '/z1/inventory-guide/smart-inventory' },
            { text: '非标模块', link: '/z1/inventory-guide/non-standard' },
          ],
        },
        {
          text: '商品模块',
          items: [
            { text: '商品管理', link: '/z1/inventory-guide/product-management' },
            { text: '商品SPU/SKU', link: '/z1/inventory-guide/spu-sku' },
            { text: '返利政策', link: '/z1/inventory-guide/rebate-policy' },
            { text: '返利与价保', link: '/z1/inventory-guide/rebate-price-protect' },
          ],
        },
        {
          text: '营销模块',
          items: [
            { text: '营销模块', link: '/z1/marketing-guide/' },
            { text: '卡券', link: '/z1/marketing-guide/coupon' },
            { text: '卡券转赠', link: '/z1/marketing-guide/coupon-gift' },
            { text: '自定义商城活动页', link: '/z1/marketing-guide/custom-page' },
            { text: '门店客流统计', link: '/z1/marketing-guide/foot-traffic' },
            { text: '短信通知', link: '/z1/marketing-guide/sms-notification' },
            { text: '签码管理', link: '/z1/marketing-guide/qrcode' },
          ],
        },
        {
          text: '商城模块',
          items: [
            { text: '商城管理后台', link: '/z1/marketing-guide/mall-admin' },
            { text: '商城销售服务', link: '/z1/marketing-guide/mall-sales' },
            { text: '预售活动', link: '/z1/marketing-guide/pre-sale' },
            { text: '商城首页设置', link: '/z1/marketing-guide/mall-home' },
          ],
        },
        {
          text: '人事模块',
          items: [
            { text: '职员模块', link: '/z1/operations/staff-module' },
            { text: '部门模块', link: '/z1/operations/department' },
            { text: '门店管理', link: '/z1/operations/store-management' },
            { text: '考勤模块', link: '/z1/operations/attendance' },
            { text: '工资表', link: '/z1/operations/payroll' },
            { text: '绩效模块', link: '/z1/operations/performance' },
          ],
        },
        {
          text: '系统设置',
          items: [
            { text: '权限包', link: '/z1/operations/permission-package' },
            { text: '职员登录记录', link: '/z1/operations/login-record' },
            { text: '用户名密码登录', link: '/z1/operations/password-login' },
          ],
        },
        {
          text: '财务模块',
          items: [
            { text: '往来对账单', link: '/z1/operations/account-statement' },
            { text: '财务代收', link: '/z1/operations/finance-collection' },
            { text: '报损单', link: '/z1/operations/loss-report' },
            { text: '财务支出单', link: '/z1/operations/payment' },
            { text: '发票管理', link: '/z1/operations/invoice' },
            { text: '会计科目管理', link: '/z1/operations/accounting' },
            { text: '财务月结', link: '/z1/operations/monthly-close' },
          ],
        },
        {
          text: '回收模块',
          items: [
            { text: '回收模块', link: '/z1/sales-guide/recycle' },
            { text: '平台转售管理', link: '/z1/sales-guide/resale' },
            { text: '标签打印', link: '/z1/sales-guide/label-print' },
          ],
        },
        {
          text: '采购管理',
          items: [
            { text: '采购功能', link: '/z1/inventory-guide/purchase' },
            { text: '临时找货功能', link: '/z1/inventory-guide/temp-search' },
            { text: '太力订单对接', link: '/z1/inventory-guide/taili' },
            { text: '报货单', link: '/z1/inventory-guide/replenish' },
          ],
        },
        {
          text: '审批模块',
          items: [
            { text: '审批流程中心', link: '/z1/operations/approval-center' },
            { text: '待审批处理', link: '/z1/operations/pending-approval' },
          ],
        },
        {
          text: '支付模块',
          items: [
            { text: '支付模块', link: '/z1/operations/payment-module' },
            { text: '银行账户', link: '/z1/operations/bank-account' },
          ],
        },
        {
          text: '运营商模块',
          items: [
            { text: '运营商模块', link: '/z1/operations/operator' },
            { text: '序列号管理', link: '/z1/operations/operator-serial' },
          ],
        },

        {
          text: '通知中心',
          items: [
            { text: '通知中心', link: '/z1/operations/notification' },
            { text: '通知模块介绍', link: '/z1/operations/notification-intro' },
          ],
        },
        {
          text: '其他模块',
          items: [
            { text: '表单模块', link: '/z1/operations/form' },
            { text: '企业微信客户', link: '/z1/operations/wecom-customer' },
            { text: '任务管理', link: '/z1/operations/task' },
            { text: '目标管理', link: '/z1/operations/goal' },
            { text: '工分管理', link: '/z1/operations/points' },
            { text: '提成基础参数', link: '/z1/operations/commission' },
            { text: '合同管理', link: '/z1/operations/contract' },
            { text: '维修文档', link: '/z1/operations/repair' },
            { text: '分类模块', link: '/z1/operations/category' },
            { text: '邀请模块', link: '/z1/operations/invite' },
          ],
        },
      ],
    },
    footer: {
      message: '© 2026 晋城市掌上乾坤网络科技有限公司 版权所有',
      copyright: '晋ICP备14005487号-2',
    },
  },
});
