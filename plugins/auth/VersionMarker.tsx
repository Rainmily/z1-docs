import { useState, useEffect } from 'react';

/**
 * 动态版本标记组件
 * 显示当前构建时间，用于验证页面是否被浏览器缓存
 */
export function VersionMarker() {
  const [version, setVersion] = useState('加载中...');

  useEffect(() => {
    // 使用动态时间戳，每次页面加载都会更新
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 16).replace(/[:-]/g, '');
    setVersion(`v${timestamp}`);
  }, []);

  return (
    <div style={{
      textAlign: 'center',
      padding: '12px',
      marginTop: '24px',
      borderTop: '1px solid #eee',
      color: '#666',
      fontSize: '14px',
    }}>
      文档版本: {version}
    </div>
  );
}
