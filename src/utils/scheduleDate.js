// 行事曆日期字串的共用解析工具。
// 行事曆日期格式為「月/日」，可為單日（5/1）、完整區間（5/1-5/3）
// 或縮寫區間（3/7-8，結尾只寫日、沿用開始的月份）。

import { isValidLink } from './links';

// 將單一「月/日」字串解析成 Date。
// 若算出的日期已超過 6 個月前，視為下一年度的行程（跨年處理）。
function parseMonthDay(part) {
  const parts = String(part || '').trim().split('/');
  if (parts.length < 2) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;
  const now = new Date();
  const date = new Date(now.getFullYear(), month - 1, day);
  if (now - date > 180 * 24 * 60 * 60 * 1000) {
    return new Date(now.getFullYear() + 1, month - 1, day);
  }
  return date;
}

// 取行程的開始日期（區間取第一段）。
export function parseScheduleDate(dateStr) {
  return parseMonthDay(String(dateStr || '').split('-')[0]);
}

// 取行程的結束日期。
// 區間取最後一段；若結尾是縮寫（如 "3/7-8" 的 "8"，沒有月份），
// 則沿用開始日的月份組成「月/日」再解析。
export function parseScheduleEndDate(dateStr) {
  const segments = String(dateStr || '').split('-');
  const lastSeg = segments[segments.length - 1].trim();
  if (lastSeg.includes('/')) {
    return parseMonthDay(lastSeg);
  }
  const startMonth = segments[0].trim().split('/')[0];
  if (!startMonth || !lastSeg) return null;
  return parseMonthDay(`${startMonth}/${lastSeg}`);
}

// 判斷行程是否已結束（結束日早於今天 → 已出隊）。
export function isTripPast(dateStr) {
  const end = parseScheduleEndDate(dateStr);
  if (!end) return false;
  return end < startOfToday();
}

// 將 <input type="date"> 的 "YYYY-MM-DD" 字串轉成當天 00:00 的 Date。
function parseISODate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || '').trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

// 計算一支隊伍在前台要顯示的狀態（首頁與行事曆頁共用）。
// 回傳： 'cancelled' | 'done' | 'signup-open' | 'signup-closed' | 'signup-pending'
export function getTripStatus(item) {
  if (!item) return 'signup-pending';

  // 1. 倒隊（手動）最優先
  if (item.cancelled) return 'cancelled';

  // 2. 已出隊（行程日期已過）
  if (isTripPast(item.date)) return 'done';

  // 3. 報名相關
  if (!isValidLink(item.signup_url)) return 'signup-pending';
  if (item.signup_closed) return 'signup-closed';            // 手動立即關閉

  const today = startOfToday();
  const start = parseISODate(item.signup_start);
  const end = parseISODate(item.signup_end);
  if (start && today < start) return 'signup-pending';        // 報名還沒開始
  if (end && today > end) return 'signup-closed';             // 已過截止日（截止日當天仍可報名）
  return 'signup-open';
}
