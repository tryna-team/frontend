import { Button } from '@/components/common/Buttons';

type HeaderVariant = 'daily' | 'modal';

type HeaderLeading =
  | { type: 'none' }
  | {
      type: 'icon';
      onClick?: () => void;
    }
  | {
      type: 'icon-text';
      text: string;
      onClick?: () => void;
    };

type HeaderTrailing =
  | { type: 'none' }
  | {
      type: 'menu';
      onClick?: () => void;
    }
  | {
      type: 'text';
      text: string;
      onClick?: () => void;
      // 라벨 수정 바텀시트의 "완료" 버튼처럼, 변경 사항이 있을 때만 활성화해야 하는
      // 경우를 위해 추가. 생략 시(undefined) 기존 동작과 동일하게 항상 활성화됨.
      disabled?: boolean;
    };

type HeaderProps = {
  variant?: HeaderVariant;
  title?: string;
  leading?: HeaderLeading;
  trailing?: HeaderTrailing;
};

/*
 * Header는 leading, title, trailing의 내부 배치를 담당합니다.
 *
 * daily variant는 좌우 패딩(px-margin-small, 20px)을 컴포넌트 내부에서 자체 적용합니다
 * (아래 daily.container 참고). modal variant는 Modal 내부 콘텐츠 너비(353px)에 맞춰
 * 배치되므로 여전히 Header를 사용하는 Modal 쪽에서 폭/여백을 설정합니다.
 */
const HEADER_STYLE = {
  daily: {
    /*
     * Daily Header
     * 부모 영역의 전체 너비를 사용
     *
     * TODO: 좌우 패딩(px-margin-small)을 여기서 자체 적용하도록 바꿨음 — 화면마다
     * wrapper 씌우는 걸 잊어버릴 위험은 줄지만, 나중에 여백 없는 풀블리드 헤더가
     * 필요해지면 이 안에서 별도 prop 등으로 예외 처리를 해야 함. 반대로 바깥에서
     * <div className="px-margin-small">로 감싸는 방식은 그런 예외 대응이 더 쉽고
     * 호출부에서 여백 적용 여부가 명시적으로 보인다는 장점이 있으니, 상황에 따라
     * 바깥에서 감싸는 방식으로 되돌리는 것도 같이 고려할 것.
     */
    container: 'flex h-[52px] w-full items-center justify-between px-margin-small',

    // leading과 trailing에 같은 너비를 지정해 title이 중앙에 위치하도록 구성
    leadingSlot: 'flex h-full w-[104px] shrink-0 items-center justify-start',
    leadingContent: 'flex h-[25px] items-center gap-small',
    title:
      'flex h-[26px] min-w-0 flex-1 items-center justify-center gap-[10px] text-center text-text-default default-body-strong-large',
    trailingSlot: 'flex h-full w-[104px] shrink-0 items-center justify-end self-stretch py-2',
  },

  modal: {
    /*
     * Modal Header
     * Modal 내부 콘텐츠 너비인 353px 사용. 높이는 피그마 BottomSheetHeader(68px) 기준 —
     * 명시하지 않으면 콘텐츠(아이콘/텍스트) 높이만큼만 차지해서, 그 아래 첫 콘텐츠박스와의
     * 간격이 피그마보다 좁아 보인다.
     * 배경은 피그마 BottomSheetHeader(node 3317:39496) 스펙대로 거의 완전 투명한
     * 흰색(rgba(255,255,255,0.01))으로 명시한다 — 지금까지는 배경을 아예 지정하지
     * 않아 부모 Frame의 불투명 흰 배경에 그대로 얹혀 있었다.
     * ⚠️ 피그마 원본은 이 헤더가 스크롤 콘텐츠 위에 겹치는 absolute 오버레이라 투명도가
     * 뒤로 비치는 콘텐츠로 눈에 보이지만, 지금 EventEditBottomSheet 구조는 헤더가 스크롤
     * 영역과 겹치지 않는 별도 flex 형제라 이 값만으로는 시각적 차이가 거의 없다(둘 다
     * 흰 배경이라 투명해도 흰색으로 보임) — 실제로 비치는 효과를 보려면 헤더를 스크롤
     * 콘텐츠와 겹치는 오버레이 구조로 바꿔야 한다.
     */
    container:
      'flex h-[68px] w-[353px] items-center justify-between bg-[rgba(255,255,255,0.01)] backdrop-blur-none',

    // leading과 trailing 영역을 각각 74px로 고정해 title을 중앙에 배치
    leadingSlot: 'flex w-[74px] shrink-0 items-center gap-[10px]',
    leadingContent: 'flex items-center gap-[10px]',
    title: 'min-w-0 flex-1 truncate text-center text-text-default default-heading-small',
    trailingSlot: 'flex w-[74px] shrink-0 items-center justify-end',
  },
} as const;

/*
 * variant별로 사용하는 아이콘 경로를 관리합니다.
 * public/icon을 기준으로 절대 경로를 사용합니다.
 */
const HEADER_ICON = {
  daily: {
    leading: '/icon/chevron/left_medium.svg',
    menu: '/icon/icons/hamburger_medium.svg',
  },

  modal: {
    leading: '/icon/chevron/left_small.svg',
    menu: '/icon/icons/hamburger_medium.svg',
  },
} as const;

export default function Header({
  variant = 'daily',
  title = '',
  leading = { type: 'none' },
  trailing = { type: 'none' },
}: HeaderProps) {
  const style = HEADER_STYLE[variant];
  const icon = HEADER_ICON[variant];

  const renderLeading = () => {
    if (leading.type === 'none') {
      return null;
    }

    // 버튼 컴포넌트로 대체: daily variant의 아이콘+텍스트 조합(챕터론 24px + Default/Body/Large)이
    // Button의 IconTextDefault 프리셋(Figma node 1516:8116)과 동일해 공용 컴포넌트로 교체함.
    // modal variant의 leading은 아이콘 크기/간격이 달라 프리셋에 안 맞으므로 그대로 둠.
    if (variant === 'daily' && leading.type === 'icon-text') {
      return (
        <Button
          variant="IconTextDefault"
          icon={icon.leading.replace(/^\/icon\//, '')}
          alt=""
          aria-label="뒤로"
          onClick={leading.onClick}
          className={`${style.leadingContent} justify-start`}
        >
          {leading.text}
        </Button>
      );
    }

    return (
      <button
        type="button"
        onClick={leading.onClick}
        aria-label="뒤로"
        className={`${style.leadingContent} border-0 bg-transparent p-0`}
      >
        <img src={icon.leading} alt="" className="block shrink-0 object-contain" />

        {leading.type === 'icon-text' && (
          <span className="whitespace-nowrap text-text-default default-body-large">
            {leading.text}
          </span>
        )}
      </button>
    );
  };

  const renderTrailing = () => {
    if (trailing.type === 'none') {
      return null;
    }

    if (trailing.type === 'menu') {
      return (
        <button
          type="button"
          onClick={trailing.onClick}
          aria-label="메뉴"
          className="flex items-center justify-center border-0 bg-transparent p-0"
        >
          <img src={icon.menu} alt="" className="block shrink-0 object-contain" />
        </button>
      );
    }

    if (variant === 'daily') {
      return (
        <Button
          type="button"
          variant="Small"
          onClick={trailing.onClick}
          disabled={trailing.disabled} // disabled 전달 추가
          className="ml-auto justify-end text-right"
        >
          {trailing.text}
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="MediumDefaultFit"
        onClick={trailing.onClick}
        disabled={trailing.disabled} // disabled 전달 추가
      >
        {trailing.text}
      </Button>
    );
  };

  return (
    <header className={style.container}>
      <div className={style.leadingSlot}>{renderLeading()}</div>

      <h1 className={style.title}>{title}</h1>

      <div className={style.trailingSlot}>{renderTrailing()}</div>
    </header>
  );
}
