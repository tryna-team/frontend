import type { CategoryColor } from '@/features/calendar/types';

export interface ScheduleItem {
  id: string;
  categoryColor: CategoryColor;
  title: string;
  location?: string;
  startTime: string;
  endTime?: string;
  date: string;
}

// TODO: 실데이터 연동 시 API 응답으로 교체
export const MOCK_SCHEDULES: ScheduleItem[] = [
  {
    id: '1',
    categoryColor: 'green',
    title: '동아리 정기 미팅',
    startTime: '18:00',
    endTime: '18:30',
    date: '2026-06-04',
  },
  {
    id: '2',
    categoryColor: 'apricot',
    title: '아빠 생신 식사',
    startTime: '20:00',
    endTime: '21:00',
    date: '2026-06-04',
  },
];