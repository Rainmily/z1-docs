/**
 * 页面元信息组件 - 显示日期和作者
 * 渲染于文章正文下方、DocFooter 上方
 */

import React from 'react';
import { usePageData } from '@rspress/core/runtime';

export function PageMeta(): JSX.Element | null {
  let pageData: { frontmatter?: Record<string, unknown> } = {};
  try {
    const result = usePageData();
    pageData = result?.page ?? {};
  } catch {
    // usePageData 在某些上下文下不可用，静默降级
    return null;
  }

  const frontmatter = pageData?.frontmatter ?? {};
  const date = frontmatter['date'];
  const author = frontmatter['author'];

  if (!date && !author) {
    return null;
  }

  // 格式化日期显示
  let displayDate = '';
  if (date) {
    try {
      const d = new Date(date as string);
      if (!isNaN(d.getTime())) {
        displayDate = d.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      } else {
        displayDate = String(date);
      }
    } catch {
      displayDate = String(date);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 0',
        marginBottom: '8px',
        borderTop: '1px solid var(--rp-c-divider)',
        borderBottom: '1px solid var(--rp-c-divider)',
        fontSize: '14px',
        color: 'var(--rp-c-text-2)',
      }}
    >
      {displayDate && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>📅</span>
          <span>{displayDate}</span>
        </span>
      )}
      {author && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>✍️</span>
          <span>{String(author)}</span>
        </span>
      )}
    </div>
  );
}
