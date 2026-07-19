// 레이블 색상 타입
export type LabelColor =
  | 'apricot'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'yellow';

// 반복 설정 타입
export type RepeatType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';

type ColorLabelItemProps = {
  type: 'color';
  label: string;
  color: LabelColor;
  onClick?: () => void;
};

type CreateLabelItemProps = {
  type: 'create';
  onClick?: () => void;
};

type RepeatLabelItemProps = {
  type: 'repeat';
  label: string;
  description?: string;
  repeatType: RepeatType;
  onClick?: () => void;
};

type LabelItemProps =
  | ColorLabelItemProps
  | CreateLabelItemProps
  | RepeatLabelItemProps;

const COLOR_ICON: Record<LabelColor, string> = {
  apricot: '/icon/color_picker/apricot_medium.svg',
  blue: '/icon/color_picker/blue_medium.svg',
  green: '/icon/color_picker/green_medium.svg',
  pink: '/icon/color_picker/pink_medium.svg',
  purple: '/icon/color_picker/purple_medium.svg',
  yellow: '/icon/color_picker/yellow_medium.svg',
};

const CREATE_ICON =
  '/icon/chevron/right_small.svg';

export default function LabelItem(
  props: LabelItemProps,
) {
  const isColorItem =
    props.type === 'color';

  const isCreateItem =
    props.type === 'create';

  // 접근성용 라벨
  const ariaLabel = (() => {
    if (isCreateItem) {
      return '새로운 레이블 생성';
    }

    if (isColorItem) {
      return `${props.label} 레이블 선택`;
    }

    return `${props.label} 반복 설정 선택`;
  })();

  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex w-[200px] items-center justify-between px-5 py-2 text-left"
      aria-label={ariaLabel}
    >
      {/* 좌측 텍스트 영역 */}
      {isCreateItem ? (
        <span className="min-w-0 truncate text-[16px] font-medium leading-6 tracking-[-0.3px] text-[#1C1630]">
          새로운 레이블
        </span>
      ) : (
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[16px] font-medium leading-6 tracking-[-0.3px] text-[#1C1630]">
            {props.label}
          </span>

          {props.type === 'repeat' &&
            props.description && (
              <span className="min-w-0 truncate text-[16px] font-medium leading-6 tracking-[-0.3px] text-[var(--Semantic-Text-Disable,rgba(28,22,48,0.30))]">
                ({props.description})
              </span>
            )}
        </span>
      )}

      {/* 우측 아이콘 영역 */}
      {isCreateItem ? (
        <img
          src={CREATE_ICON}
          alt=""
          className="block h-6 w-6 shrink-0"
        />
      ) : isColorItem ? (
        <img
          src={COLOR_ICON[props.color]}
          alt=""
          className="block h-6 w-6 shrink-0"
        />
      ) : (
        // 반복 설정은 아이콘 대신 동일한 크기의 빈 영역 유지
        <span
          className="flex h-6 w-6 shrink-0 items-center gap-[10px]"
          aria-hidden="true"
        />
      )}
    </button>
  );
}