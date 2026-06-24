// 連結相關的共用工具：前台顯示判斷 + 後台格式驗證
// 行事曆的 FB / 報名表單欄位都共用這裡的邏輯。

// 前台用：判斷一個連結欄位是否「有填且不是『無』」，決定要不要顯示。
export function isValidLink(url) {
  return typeof url === 'string' && url.trim() !== '' && url.trim() !== '無';
}

// 後台用：是否為合法的 http(s) 網址。
export function isHttpUrl(url) {
  const trimmed = String(url || '').trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

// 後台用：是否為 Google 表單連結（forms.gle 短網址或 docs.google.com/forms）。
export function isGoogleFormUrl(url) {
  if (!isHttpUrl(url)) return false;
  let host = '';
  let pathname = '';
  try {
    const parsed = new URL(String(url).trim());
    host = parsed.hostname.toLowerCase();
    pathname = parsed.pathname.toLowerCase();
  } catch {
    return false;
  }
  if (host === 'forms.gle') return true;
  if ((host === 'docs.google.com' || host === 'www.google.com') && pathname.startsWith('/forms')) return true;
  return false;
}

// 後台用：是否為 Facebook 連結。
export function isFacebookUrl(url) {
  if (!isHttpUrl(url)) return false;
  let host = '';
  try {
    host = new URL(String(url).trim()).hostname.toLowerCase();
  } catch {
    return false;
  }
  return /(^|\.)(facebook\.com|fb\.com|fb\.me|m\.facebook\.com)$/.test(host);
}
