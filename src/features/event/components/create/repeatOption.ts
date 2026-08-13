import type { RepeatType } from '@/components/common/LabelModal/LabelItem';
import type { RecurrenceType } from '@/apis/types/eventDetail';

import type { RepeatOption } from './EventScheduleRow';

// RepeatType(반복 선택 모달의 값) -> RepeatOption(화면에 표시하는 한글 값) 매핑.
// RepeatScheduleBottomSheet/EventEditBottomSheet가 공유한다.
export const REPEAT_OPTION: Record<RepeatType, RepeatOption> = {
  none: '반복 없음',
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
  yearly: '매년',
};

// RepeatOption(화면 표시값) -> RecurrenceType(API 요청값) 매핑. EventEditBottomSheet가
// "완료" 저장 시 PATCH(C107) 바디의 isRecurring/recurrenceType을 만드는 데 쓴다.
export const REPEAT_OPTION_TO_RECURRENCE_TYPE: Record<RepeatOption, RecurrenceType> = {
  '반복 없음': 'NONE',
  매일: 'DAILY',
  매주: 'WEEKLY',
  매월: 'MONTHLY',
  매년: 'YEARLY',
};
