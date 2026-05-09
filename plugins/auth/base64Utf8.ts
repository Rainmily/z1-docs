/**
 * UTF-8 安全的 Base64 编解码
 * btoa/atob 只支持 Latin-1 字符，处理中文会损坏数据
 */

/** 编码：将 UTF-8 字符串 safeBtoa 转 base64 */
export function safeBtoa(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/** 解码：将 base64 safeBtoa 解回 UTF-8 字符串 */
export function safeAtob(base64: string): string {
  const binary = atob(base64);
  return decodeURIComponent(
    Array.from(binary, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
}

/** 解码 base64url 字符串（浏览器安全版本） */
export function safeBase64UrlDecode(base64url: string): string {
  // base64url: - 替换为 +, _ 替换为 /
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // 补齐 padding
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return safeAtob(padded);
}
