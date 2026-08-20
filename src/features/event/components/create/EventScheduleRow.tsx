import Button from '@/components/common/Buttons/Button';

export type RepeatOption = '반복 없음' | '매일' | '매주' | '매월' | '매년';

type DateTimeRowProps = {
  type: 'date-time';
  leading: '시작' | '종료';
  date: string;
  time: string;
  hideTime?: boolean;
  onDateClick?: () => void;
  onTimeClick?: () => void;
};

type RepeatRowProps = {
  type: 'repeat';
  leading: '반복';
  repeat: RepeatOption;
  onRepeatClick?: () => void;
};

// 시작, 종료 행 / 반복 행의 trailing 구분
export type EventScheduleRowProps = DateTimeRowProps | RepeatRowProps;

const CHEVRON_ICON = '/icon/chevron/left_xsmall.svg';

export default function EventScheduleRow(props: EventScheduleRowProps) {
  return (
    <div className="box-content flex h-[52px] w-[329px] items-center justify-between bg-transparent pr-padding-xsmall pl-padding-medium">
      {/* 피그마 이 화면(날짜/시간 피커) 실측: "시작"/"종료"/"반복" 라벨과 날짜·시간·반복
          값 모두 Default/Body/Large(17px/500)로 동일하다. */}
      <span className="shrink-0 text-text-default default-body-large">{props.leading}</span>

      {/* 시작/종료: 날짜 버튼 + 시간 버튼 */}
      {props.type === 'date-time' ? (
        <div className="flex shrink-0 items-center gap-2">
          {/* 날짜/시간 버튼 너비는 고정폭으로 둔다 — "MediumDefaultFit"은 텍스트 길이만큼
              늘었다 줄었다 해서(px-6 패딩만 고정) 날짜/시간 자릿수가 바뀌면 버튼 폭도
              흔들렸다. 날짜 125px/시간 90px는 EventEditBottomSheet와 동일한 값.
              MediumDefaultFit 기본 텍스트 스타일(default-body-strong-medium, 15px/600)은
              다른 여러 버튼(Header 완료, Input 지우기 등)과 공유하는 값이라 여기서 직접
              못 바꾸고, 이 두 버튼에만 default-body-large(17px/500, 피그마 실측)를
              className으로 덧붙여 덮어쓴다 — 둘 다 tds의 같은 @layer utilities 안에
              default-body-large가 default-body-strong-medium보다 뒤에 정의돼 있어
              font-size/weight/line-height/letter-spacing이 전부 안전하게 override된다. */}
          <Button
            variant="MediumDefaultFit"
            className="w-31.25 default-body-large"
            onClick={props.onDateClick}
            aria-label={`${props.leading} 날짜 ${props.date}`}
          >
            {props.date}
          </Button>

          {!props.hideTime && (
            <Button
              variant="MediumDefaultFit"
              className="w-22.5 default-body-large"
              onClick={props.onTimeClick}
              aria-label={`${props.leading} 시간 ${props.time}`}
            >
              {props.time}
            </Button>
          )}
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

          <span className="flex flex-col items-center" aria-hidden="true">
            {/* left 아이콘을 회전해 위아래 chevron 구성 */}
            <img src={CHEVRON_ICON} alt="" className="block size-3 rotate-90 opacity-30" />
            <img src={CHEVRON_ICON} alt="" className="-mt-0.5 block size-3 -rotate-90 opacity-30" />
          </span>
        </button>
      )}
    </div>
  );
}
