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
    };

type HeaderProps = {
  variant?: HeaderVariant;
  title?: string;
  leading?: HeaderLeading;
  trailing?: HeaderTrailing;
};

/*
 * Header는 leading, title, trailing의 내부 배치만 담당합니다.
 *
 * 화면별 좌우 padding과 외부 여백은 Header를 사용하는 페이지나 Modal에서 설정합니다.
 * 예: Daily 페이지에서 <div className="px-margin-small">로 Header를 감싸서 사용
*/
const HEADER_STYLE = {
  daily: {
    /*
     * Daily Header
     * 부모 영역의 전체 너비를 사용
    */
    container: 'flex h-[42px] w-full items-center justify-between',

    // leading과 trailing에 같은 너비를 지정해 title이 중앙에 위치하도록 구성
    leadingSlot: 'flex h-full w-[104px] shrink-0 items-center justify-start',
    leadingContent: 'flex h-[25px] items-center gap-small',
    title: 'flex h-[26px] min-w-0 flex-1 items-center justify-center gap-[10px] text-center text-text-default default-body-strong-large',
    trailingSlot: 'flex h-full w-[104px] shrink-0 items-center justify-end self-stretch py-2',
  },

  modal: {
    /*
     * Modal Header
     * Modal 내부 콘텐츠 너비인 353px 사용
    */
    container: 'flex w-[353px] items-center justify-between',

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

    return (
      <button
        type="button"
        onClick={leading.onClick}
        aria-label="뒤로"
        className={`${style.leadingContent} border-0 bg-transparent p-0`}
      >
        <img
          src={icon.leading}
          alt=""
          className="block shrink-0 object-contain"
        />

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
          <img
            src={icon.menu}
            alt=""
            className="block shrink-0 object-contain"
          />
        </button>
      );
    }

    if (variant === 'daily') {
      return (
        <Button
          type="button"
          variant="Small"
          onClick={trailing.onClick}
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