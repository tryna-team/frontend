// 반복/레이블 목록에서 사용하는 공통 아이템
import LabelItem from './LabelItem';

import type {
  LabelColor,
  RepeatType,
} from './LabelItem';

// 레이블 목록 데이터
export type LabelItemData = {
  id: number;
  label: string;
  color: LabelColor;
};

// 그룹 레이블 선택 모드
type LabelModeProps = {
  type?: 'label';
  labels?: LabelItemData[];
  onSelectLabel?: (id: number) => void;
  onCreateLabel?: () => void;
};

// 반복 설정 선택 모드
type RepeatModeProps = {
  type: 'repeat';
  selectedDate: Date;
  onSelectRepeat?: (
    repeatType: RepeatType,
  ) => void;
};

type LabelModalProps =
  | LabelModeProps
  | RepeatModeProps;

  // 반복 설정 리스트 데이터
type RepeatItemData = {
  type: RepeatType;
  label: string;
  description?: string;
};

const WEEKDAY_LABELS = [
  '일요일',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
] as const;

//선택된 날짜를 기준으로 반복 설정에 표시할 설명 생성
function getRepeatItems(
  selectedDate: Date,
): RepeatItemData[] {
  const month =
    selectedDate.getMonth() + 1;

  const date = selectedDate.getDate();

  const weekday =
    WEEKDAY_LABELS[
      selectedDate.getDay()
    ];

  return [
    {
      type: 'none',
      label: '반복 없음',
    },
    {
      type: 'daily',
      label: '매일',
    },
    {
      type: 'weekly',
      label: '매주',
      description: weekday,
    },
    {
      type: 'monthly',
      label: '매월',
      description: `${date}일`,
    },
    {
      type: 'yearly',
      label: '매년',
      description: `${month}월 ${date}일`,
    },
  ];
}

export default function LabelModal(
  props: LabelModalProps,
) {
  // 반복 설정 모달
  if (props.type === 'repeat') {
    const repeatItems = getRepeatItems(
      props.selectedDate,
    );

    return (
      <section
        className="flex w-[200px] flex-col items-start justify-center rounded-[16px] bg-white py-3 shadow-[0_0_20px_0_rgba(0,0,0,0.08)]"
        aria-label="반복 설정"
      >
        {repeatItems.map((item) => (
          <LabelItem
            key={item.type}
            type="repeat"
            repeatType={item.type}
            label={item.label}
            description={
              item.description
            }
            onClick={() =>
              props.onSelectRepeat?.(
                item.type,
              )
            }
          />
        ))}
      </section>
    );
  }

  const {
    labels = [],
    onSelectLabel,
    onCreateLabel,
  } = props;

  // 그룹 레이블 선택 모달
  return (
    <section
      className="flex w-[200px] flex-col items-start justify-center rounded-[16px] bg-white py-3 shadow-[0_0_20px_0_rgba(0,0,0,0.08)]"
      aria-label="레이블 선택"
    >
      {labels.map((item) => (
        <LabelItem
          key={item.id}
          type="color"
          label={item.label}
          color={item.color}
          onClick={() =>
            onSelectLabel?.(item.id)
          }
        />
      ))}

      <LabelItem
        type="create"
        onClick={onCreateLabel}
      />
    </section>
  );
}