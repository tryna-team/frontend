import type { DateRange } from 'react-day-picker';

/* 이벤트 생성 과정에서 사용하는 날짜 범위
 * 날짜를 선택하지 않은 경우 = undefined
 */
export type EventDateRange = DateRange | undefined;