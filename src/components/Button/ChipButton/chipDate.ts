import { format } from 'date-fns';
import type { ChipButtonDate } from './ChipButtonType';

const CHIP_DATE_FORMAT = 'MM. dd.';

// 'YYYY-MM-DD'는 로컬 자정으로 파싱한다 (new Date('YYYY-MM-DD')는 UTC로 해석되어 하루 밀릴 수 있음)
function parseChipDate(date?: ChipButtonDate): Date | null {
  if (!date) return null;
  const parsed =
    date instanceof Date
      ? date
      : /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? new Date(`${date}T00:00:00`)
        : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** 유효한 날짜면 "MM. dd." 문자열, 아니면 null */
export function formatChipDate(date?: ChipButtonDate): string | null {
  const parsed = parseChipDate(date);
  return parsed ? format(parsed, CHIP_DATE_FORMAT) : null;
}
