const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 배너에 표시할 기간 텍스트를 만든다.
 * - 하루짜리 종일 일정: "하루종일"
 * - 여러 날 걸친 일정: 선택한 날짜가 시작일로부터 몇 번째 날인지 "N일차"
 */
export function formatBannerDateText(
  startDate: string,
  endDate: string | null,
  selectedDate: string,
): string {
  if (!endDate || endDate === startDate) {
    return '하루종일';
  }

  const startTime = new Date(`${startDate}T00:00:00`).getTime();
  const selectedTime = new Date(`${selectedDate}T00:00:00`).getTime();
  const dayIndex = Math.round((selectedTime - startTime) / MS_PER_DAY) + 1;

  return `${dayIndex}일차`;
}
