const DATE_PATTERN = /^\d{1,2}\/\d{1,2}$/;
const OUT_AND_BACK_PATTERN = /(折返|往返|來回|原路返回|返回|回到|回程|回營|回山屋|回營地|回登山口)/;
const RIDE_PATTERN = /(中原大學|火車|車站|高鐵|客運|公車|接駁|搭車|開車|車程|遊覽車|租車|計程車|捷運|機車)/;
const BASE_PLACE_PATTERN = /(營地|山屋|避難山屋|工寮|獵寮|營區|登山口|停車場|管理站|民宿|山莊|學校|中原大學)/;

const DAY_TEXT = {
  1: '單日',
  2: '兩天一夜',
  3: '三天兩夜',
  4: '四天三夜',
  5: '五天四夜',
  6: '六天五夜',
  7: '七天六夜',
};

export function groupPdfTextItemsIntoRows(textItems, pageNumber) {
  const rows = [];

  for (const item of textItems) {
    const str = String(item.str || '').trim();
    if (!str) continue;

    const [, , , , x, y] = item.transform || [];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 3);
    if (!row) {
      row = { pageNumber, y, parts: [] };
      rows.push(row);
    }

    row.parts.push({ x, y, str });
    row.y = (row.y + y) / 2;
  }

  return rows
    .map((row) => ({
      ...row,
      parts: row.parts.sort((a, b) => a.x - b.x),
    }))
    .sort((a, b) => b.y - a.y);
}

export function parseActivityRecordRows(rows) {
  const metadata = extractMetadata(rows);
  const entries = extractTimelineEntries(rows);
  const { plan, dayTypes } = buildPlan(entries);

  const warnings = [];
  if (!entries.length) warnings.push('沒有辨識到時間行程，請確認 PDF 是否為活動記錄紙格式。');
  if (!metadata.activityName) warnings.push('沒有辨識到活動名稱。');
  if (!metadata.dateRange) warnings.push('沒有辨識到活動日期。');

  return {
    ...metadata,
    plan,
    dayTypes,
    itemCount: entries.length,
    warnings,
  };
}

export function formatTripDays(daysCount) {
  return DAY_TEXT[daysCount] || (daysCount ? `${daysCount} 天` : '');
}

export function applyMovementTypeToDay(day, movementType) {
  return {
    ...day,
    items: (day.items || []).map((item) => ({
      ...item,
      type: item.type === 'ride' ? 'ride' : movementType,
    })),
  };
}

function extractMetadata(rows) {
  const lines = rows.map((row) => rowToText(row)).filter(Boolean);
  const compactLines = lines.map((line) => compactText(line));
  const dateInfo = extractDateInfo(compactLines);

  const activityName = findActivityName(rows, compactLines);

  return {
    activityName,
    dateRange: dateInfo.dateRange,
    daysCount: dateInfo.daysCount,
    daysText: formatTripDays(dateInfo.daysCount),
    resolvedDates: dateInfo.resolvedDates,
    entryPlace: findValueAfterLabel(compactLines, '入山地點'),
    exitPlace: findValueAfterLabel(compactLines, '出山地點'),
    rawText: lines.join('\n'),
  };
}

function extractDateInfo(compactLines) {
  const dateLineIndex = compactLines.findIndex((line) => line.includes('活動日期'));
  const dateLine = dateLineIndex >= 0 ? compactLines[dateLineIndex] : '';
  const nextLine = dateLineIndex >= 0 ? compactLines[dateLineIndex + 1] || '' : '';

  const daysCount = parseInt(extractMatch(dateLine, /共計[:：]?([0-9]+)/), 10) || null;
  let dateRange = extractMatch(dateLine, /活動日期[:：]?(.+?)(?:共計|預備糧|入山地點|出山地點|$)/)
    .replace(/[日\s]/g, '');

  if (dateRange.endsWith('-') || dateRange.endsWith('~') || dateRange.endsWith('～') || dateRange.endsWith('至')) {
    const continuation = extractMatch(nextLine, /^([0-9]{1,2}\/[0-9]{1,2}|[0-9]{1,2})/);
    if (continuation) dateRange += continuation;
  }

  return {
    dateRange,
    daysCount,
    resolvedDates: expandDateRange(dateRange, daysCount),
  };
}

function findActivityName(rows, compactLines) {
  const inlineName = findValueAfterLabel(compactLines, '活動名稱');
  if (inlineName) return inlineName;

  const labelRow = rows.find((row) => compactText(rowToText(row)).includes('活動名稱'));
  if (!labelRow) return '';

  const candidates = rows
    .filter((row) => (
      row.pageNumber === labelRow.pageNumber
      && row.y < labelRow.y - 3
      && row.y > labelRow.y - 70
    ))
    .map((row) => compactText(columnText(row, 35, 290)))
    .filter((line) => line && !hasMetadataLabel(line));

  return candidates[0] || '';
}

function extractTimelineEntries(rows) {
  const entries = [];
  let currentDate = '';
  const metadata = extractMetadata(rows);
  const layout = detectTimelineLayout(rows);

  for (const row of rows) {
    const date = resolveRecordDate(collectTimelineField(row, layout, 'date'), metadata.resolvedDates);
    if (date) currentDate = date;

    const hour = onlyDigits(collectTimelineField(row, layout, 'hour'));
    const minute = onlyDigits(collectTimelineField(row, layout, 'minute'));
    const description = cleanRecordText(columnText(row, layout.descriptionStartX, Infinity));

    if (!currentDate || !hour || !minute || !description) continue;
    if (hour.length > 2 || minute.length > 2) continue;

    const { location, info } = splitDescription(description);
    entries.push({
      date: currentDate,
      time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
      location,
      info,
      rawText: description,
    });
  }

  return entries;
}

function detectTimelineLayout(rows) {
  const headerRow = rows.find((row) => {
    const text = compactText(rowToText(row));
    return text.includes('日時分') && /行程記[錄录]/.test(text);
  });

  const dateX = findHeaderPartX(headerRow, '日') ?? 46;
  const hourX = findHeaderPartX(headerRow, '時') ?? 84;
  const minuteX = findHeaderPartX(headerRow, '分') ?? 113;

  return {
    dateX,
    hourX,
    minuteX,
    descriptionStartX: minuteX + 32,
  };
}

function findHeaderPartX(row, label) {
  return row?.parts.find((part) => compactText(part.str) === label)?.x;
}

function collectTimelineField(row, layout, fieldName) {
  const centers = [
    { name: 'date', x: layout.dateX },
    { name: 'hour', x: layout.hourX },
    { name: 'minute', x: layout.minuteX },
  ];
  const maxLeftX = layout.descriptionStartX;

  const parts = row.parts.filter((part) => {
    if (part.x >= maxLeftX) return false;
    const nearest = centers.reduce((best, center) => (
      Math.abs(part.x - center.x) < Math.abs(part.x - best.x) ? center : best
    ), centers[0]);
    return nearest.name === fieldName && Math.abs(part.x - nearest.x) <= 18;
  });

  return cleanRecordText(joinParts(parts));
}

function buildPlan(entries) {
  const days = [];
  let currentDay = null;

  for (const entry of entries) {
    if (!currentDay || currentDay.date !== entry.date) {
      currentDay = {
        date: entry.date,
        dayLabel: `D${days.length + 1} (${entry.date})`,
        items: [],
      };
      days.push(currentDay);
    }

    currentDay.items.push({
      time: entry.time,
      location: entry.location,
      info: entry.info,
      rawText: entry.rawText,
    });
  }

  const dayTypes = days.map((day) => inferDayMovementType(day.items));
  const plan = days.map((day, index) => ({
    dayLabel: day.dayLabel,
    items: day.items.map((item) => {
      const type = isRideItem(item) ? 'ride' : dayTypes[index];
      const record = {
        time: item.time,
        location: item.location,
        type,
      };
      if (item.info) record.info = item.info;
      return record;
    }),
  }));

  return { plan, dayTypes };
}

function inferDayMovementType(items) {
  const combinedText = items.map((item) => `${item.location}${item.info || ''}`).join(' ');
  if (OUT_AND_BACK_PATTERN.test(combinedText)) return 'light';

  const seen = new Map();
  for (let index = 0; index < items.length; index += 1) {
    const normalized = normalizeBasePlace(items[index].location);
    if (!normalized || !BASE_PLACE_PATTERN.test(items[index].location)) continue;

    if (seen.has(normalized) && index - seen.get(normalized) >= 2) {
      return 'light';
    }
    seen.set(normalized, index);
  }

  return 'heavy';
}

function isRideItem(item) {
  return RIDE_PATTERN.test(`${item.location}${item.info || ''}`);
}

function splitDescription(description) {
  const text = cleanRecordText(description);
  const cutPoints = ['（', '(', '，', ',', '；', ';']
    .map((token) => text.indexOf(token))
    .filter((index) => index > 0);

  const cutAt = cutPoints.length ? Math.min(...cutPoints) : -1;
  if (cutAt === -1) return { location: text, info: '' };

  const location = text.slice(0, cutAt).trim();
  const info = text
    .slice(cutAt)
    .replace(/^[（(，,；;]+/, '')
    .replace(/[）)]$/, '')
    .trim();

  return {
    location: location || text,
    info,
  };
}

function normalizeBasePlace(text) {
  return cleanRecordText(text)
    .replace(/(出發|抵達|到達|回到|返回|前往|往|取左|取右|上|下)/g, '')
    .replace(/H\d+(\.\d+)?/gi, '')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/[，,。；;：:\s]/g, '')
    .trim();
}

function rowToText(row) {
  return cleanRecordText(joinParts(row.parts));
}

function columnText(row, minX, maxX) {
  return cleanRecordText(joinParts(row.parts.filter((part) => part.x >= minX && part.x < maxX)));
}

function joinParts(parts) {
  return parts.map((part) => part.str).join('');
}

function cleanRecordText(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([，,。；;：:）)])/g, '$1')
    .replace(/([（(])\s+/g, '$1')
    .trim();
}

function compactText(text) {
  return cleanRecordText(text).replace(/\s/g, '');
}

function onlyDigits(text) {
  return String(text || '').replace(/\D/g, '');
}

function normalizeDate(text) {
  const value = compactText(text);
  return DATE_PATTERN.test(value) ? value : '';
}

function resolveRecordDate(text, resolvedDates) {
  const value = compactText(text);
  if (!value) return '';
  if (DATE_PATTERN.test(value)) return value;
  if (!/^\d{1,2}$/.test(value)) return '';

  const day = parseInt(value, 10);
  const matchedDate = resolvedDates.find((date) => parseDateParts(date)?.day === day);
  if (matchedDate) return matchedDate;

  const fallbackMonth = parseDateParts(resolvedDates[0])?.month;
  return fallbackMonth ? `${fallbackMonth}/${day}` : value;
}

function expandDateRange(dateRange, daysCount) {
  const range = compactText(dateRange).replace(/至|～/g, '~').replace(/-/g, '~');
  if (!range) return [];

  const [startText, endText = ''] = range.split('~');
  const start = parseDateParts(startText);
  if (!start) return [];

  const end = parseDateParts(endText.includes('/') ? endText : `${start.month}/${endText}`);
  const count = daysCount || (end ? diffDaysInclusive(start, end) : 1);
  if (!count || count < 1) return [`${start.month}/${start.day}`];

  const dates = [];
  let month = start.month;
  let day = start.day;

  for (let i = 0; i < count; i += 1) {
    dates.push(`${month}/${day}`);
    day += 1;

    const daysInMonth = getDaysInMonth(month);
    if (day > daysInMonth) {
      day = 1;
      month = month === 12 ? 1 : month + 1;
    }
  }

  return dates;
}

function parseDateParts(text) {
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(compactText(text));
  if (!match) return null;
  return {
    month: parseInt(match[1], 10),
    day: parseInt(match[2], 10),
  };
}

function diffDaysInclusive(start, end) {
  let count = 1;
  let month = start.month;
  let day = start.day;

  while (!(month === end.month && day === end.day) && count < 370) {
    day += 1;
    const daysInMonth = getDaysInMonth(month);
    if (day > daysInMonth) {
      day = 1;
      month = month === 12 ? 1 : month + 1;
    }
    count += 1;
  }

  return count;
}

function getDaysInMonth(month) {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] || 31;
}

function findValueAfterLabel(lines, label) {
  const index = lines.findIndex((line) => line.includes(label));
  if (index === -1) return '';

  const currentLine = lines[index];
  const inlineValue = currentLine.split(/[：:]/).slice(1).join(':').trim();
  if (inlineValue && !hasMetadataLabel(inlineValue)) return inlineValue;

  for (let i = index + 1; i < lines.length; i += 1) {
    const nextLine = lines[i];
    if (!nextLine) continue;
    if (/活動日期|共計|預備糧|入山地點|出山地點|日時分|行程記錄|行程紀錄/.test(nextLine)) break;
    return nextLine;
  }

  return '';
}

function extractMatch(text, pattern) {
  return pattern.exec(text)?.[1] || '';
}

function hasMetadataLabel(text) {
  return /活動名稱|活動日期|共計|預備糧|入山地點|出山地點|日時分|行程記錄|行程紀錄/.test(text);
}
