// 行事曆日期字串的共用解析工具。
// 行事曆日期格式為「月/日」，可為單日（5/1）或區間（5/1-5/3）。

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

// 取行程的結束日期（區間取最後一段，單日則同開始日）。
export function parseScheduleEndDate(dateStr) {
  const segments = String(dateStr || '').split('-');
  return parseMonthDay(segments[segments.length - 1]);
}

// 判斷行程是否已結束（結束日早於今天 → 已出隊）。
export function isTripPast(dateStr) {
  const end = parseScheduleEndDate(dateStr);
  if (!end) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}
