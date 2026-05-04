import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: 'docs',
  title: '掌上乾坤 - 手机连锁门店数智化解决方案',
  description: '10年深耕，服务5000+门店。专注手机连锁门店管理系统，从进销存到会员营销，从单店到连锁全覆盖。',
  themeConfig: {
    logo: '/logo.svg',
    logoText: '掌上乾坤',
    nav: [
      { text: '产品功能', link: '/product/' },
      { text: 'Z1操作手册', link: '/z1/' },
      { text: '解决方案', link: '/solution/' },
      { text: '成功案例', link: '/cases/' },
      { text: '资源中心', link: '/resources/' },
      { text: '行业资讯', link: '/industry-news/' },
      { text: '关于我们', link: '/about/' },
            { text: '官网', link: 'https://www.whohi.cn/', target: '_blank' },
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
      '/industry-news/': [
        {
          text: '行业资讯',
          items: [
            { text: '行业资讯', link: '/industry-news/' },
            { text: '2026发展趋势', link: '/industry-news/2026-trends' },
            { text: '客户转化率提升', link: '/industry-news/customer-conversion' },
            { text: '数字化转型', link: '/industry-news/digital-transformation' },
          ],
        },
      ],
      '/about/': [
        {
          text: '关于我们',
          items: [
            { text: '公司简介', link: '/about/' },
            { text: '更新日志', link: '/about/changelog' },
          ],
        },
      ],
      '/z1/': [
        {
          text: 'Z1操作手册',
          items: [
            { text: 'Z1操作手册', link: '/z1/' },
            { text: '会员业务', link: '/z1/member-guide/' },
            { text: '储值功能', link: '/z1/member-guide/stored-value' },
          ],
        },
      ],
    },
    footer: {
      message: '© 2024 晋城市掌上乾坤网络科技有限公司 版权所有',
      copyright: '晋ICP备14005487号-2',
    },
  },
});
