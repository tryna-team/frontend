import type { CategoryColor } from '@/features/calendar/types';

interface EventBannerProps {
  categoryColor?: CategoryColor;
  title: string;
  // 장기이벤트(하루종일 | 이틀 이상)면 카테고리 색 배경 + 기간 텍스트를,
  // 단기이벤트면 그레이 배경만 보여준다(피그마 node 1246:16377).
  isAllDay: boolean;
  // "하루종일" | "N일차" — isAllDay일 때만 사용
  dateText?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const BACKGROUND_CLASS_NAME: Record<CategoryColor, string> = {
  green: 'bg-green-50',
  apricot: 'bg-apricot-50',
  yellow: 'bg-yellow-50',
  blue: 'bg-blue-50',
  pink: 'bg-pink-50',
  purple: 'bg-purple-50',
};

const DATE_TEXT_COLOR_CLASS_NAME: Record<CategoryColor, string> = {
  green: 'text-green-500',
  apricot: 'text-apricot-500',
  yellow: 'text-yellow-500',
  blue: 'text-blue-500',
  pink: 'text-pink-500',
  purple: 'text-purple-500',
};

function EventBanner({
  categoryColor = 'green',
  title,
  isAllDay,
  dateText,
  onClick,
  disabled = false,
}: EventBannerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between px-5 py-1 text-left ${
        isAllDay ? BACKGROUND_CLASS_NAME[categoryColor] : 'bg-grey-50'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 pl-1">
        <img
          src={`/icon/alert_indicator/dot_${categoryColor}.svg`}
          alt=""
          className="size-1.5 shrink-0"
        />
        <span className="truncate default-body-large text-text-default">{title}</span>
      </div>
      {isAllDay && dateText && (
        <span
          className={`shrink-0 default-label-large ${DATE_TEXT_COLOR_CLASS_NAME[categoryColor]}`}
        >
          {dateText}
        </span>
      )}
    </button>
  );
}

export default EventBanner;
