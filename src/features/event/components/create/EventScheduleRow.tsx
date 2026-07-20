import Button from '@/components/common/Buttons/Button';

export type RepeatOption =
  | '매일'
  | '매주'
  | '매월'
  | '매년';

type DateTimeRowProps = {
  type: 'date-time';
  leading: '시작' | '종료';
  date: string;
  time: string;
  onDateClick?: () => void;
  onTimeClick?: () => void;
};

type RepeatRowProps = {
  type: 'repeat';
  leading: '반복';
  repeat: RepeatOption;
  onRepeatClick?: () => void;
};

// 시작,종료 행 / 반복 행의 trailing 구분
export type EventScheduleRowProps =
  | DateTimeRowProps
  | RepeatRowProps;

const CHEVRON_ICON =
  '/icon/chevron/left_xsmall.svg';

export default function EventScheduleRow(
  props: EventScheduleRowProps,
) {
  return (
    <div className="flex h-[52px] w-[329px] items-center justify-between bg-transparent px-padding-xsmall">
      <span className="shrink-0 text-text-default default-body-large">
        {props.leading}
      </span>

      {/* 시작/종료: 날짜 버튼 + 시간 버튼 */}
      {props.type === 'date-time' ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="MediumDefaultFit"
            onClick={props.onDateClick}
            aria-label={`${props.leading} 날짜 ${props.date}`}
          >
            {props.date}
          </Button>

          <Button
            variant="MediumDefaultFit"
            onClick={props.onTimeClick}
            aria-label={`${props.leading} 시간 ${props.time}`}
          >
            {props.time}
          </Button>
        </div>
      ) : (
        // '반복' + chevron
        <button
          type="button"
          onClick={props.onRepeatClick}
          aria-label={`반복 주기 ${props.repeat}`}
          className="flex shrink-0 items-center gap-2 border-0 bg-transparent p-0 text-text-default default-body-large"
        >
          <span>{props.repeat}</span>

          <span
            className="flex flex-col items-center"
            aria-hidden="true"
          >
            {/* left 아이콘을 회전해 위아래 chevron 구성 */}
            <img
              src={CHEVRON_ICON}
              alt=""
              className="block size-3 rotate-90 opacity-30"
            />
            <img
              src={CHEVRON_ICON}
              alt=""
              className="-mt-0.5 block size-3 -rotate-90 opacity-30"
            />
          </span>
        </button>
      )}
    </div>
  );
}
