import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: 'docs',
  title: '掌上乾坤 - 手机连锁门店数智化解决方案',
  description: '10年深耕，服务5000+门店。专注手机连锁门店管理系统，从进销存到会员营销，从单店到连锁全覆盖。',
  themeConfig: {
    logo: '/logo.svg',
    logoText: '掌上乾坤',
    nav: [
      { text: '产品功能', link: '/products/' },
      { text: 'Z1操作手册', link: '/z1/' },
      { text: '解决方案', link: '/solutions/' },
      { text: '成功案例', link: '/cases/' },
      { text: '资源中心', link: '/resources/' },
      { text: '关于我们', link: '/about/' },
      { text: 'ASA设计', link: '/asa-design' },
      { text: '官网', link: 'https://www.whohi.cn/', target: '_blank' },
    ],
    sidebar: {
      '/products/': [
        {
          text: '产品功能',
          items: [
            { text: '智能收银 POS', link: '/products/pos' },
            { text: '库存管理', link: '/products/inventory' },
            { text: '会员营销', link: '/products/member' },
            { text: '数据报表', link: '/products/report' },
            { text: '员工管理', link: '/products/staff' },
            { text: '串码管理', link: '/products/serial' },
          ],
        },
      ],
      '/solutions/': [
        {
          text: '解决方案',
          items: [
            { text: '单店方案', link: '/solutions/single' },
            { text: '连锁方案', link: '/solutions/chain' },
            { text: '品牌方案', link: '/solutions/brand' },
            { text: '运营商方案', link: '/solutions/carrier' },
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
            { text: '帮助文档', link: '/resources/' },
            { text: '视频教程', link: '/resources/videos' },
            { text: '行业报告', link: '/resources/reports' },
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
