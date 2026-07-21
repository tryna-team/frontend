import type { CategoryColor } from '@/features/calendar/types';

interface DailyScheduleDetailProps {
  categoryColor?: CategoryColor;
  startTime: string;
  endTime: string;
  rotationText?: string;
  location: string;
}

// TODO: 자리만 구현된 컴포넌트입니다. 시간/장소 클릭 등 상호작용은 아직 없습니다.
const BORDER_COLOR_CLASS_NAME: Record<CategoryColor, string> = {
  green: 'border-green-500',
  apricot: 'border-apricot-500',
  blue: 'border-blue-500',
  pink: 'border-pink-500',
  purple: 'border-purple-500',
  yellow: 'border-yellow-500',
};

export default function DailyScheduleDetail({
  //카테고리 그룹에 따라 색상 지정으로 수정 필요(테스트용 하드코딩)
  categoryColor = 'green',
  startTime,
  endTime,
  rotationText,
  location,
}: DailyScheduleDetailProps) {
  return (
    <div className="flex w-full items-center py-3 pl-6">
      <div
        className={`flex items-center gap-1 border-l-2 pl-4.5 default-label-large text-text-additional ${BORDER_COLOR_CLASS_NAME[categoryColor]}`}
      >
        <div className="flex items-center">
          <span>{startTime}</span>
          <span>-</span>
          <span>{endTime}</span>
        </div>
        {rotationText && <span>{rotationText}</span>}
        <span>{location}</span>
      </div>
    </div>
  );
}
