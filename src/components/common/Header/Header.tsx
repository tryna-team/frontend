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

const HEADER_STYLE = {
  daily: {
    container:
      'flex h-[42px] w-[393px] items-center justify-between px-margin-small',
    leadingSlot:
      'flex h-full w-[104px] shrink-0 items-center justify-start',
    leadingContent: 'flex h-[25px] items-center gap-small',
    title:
      'flex h-[26px] min-w-0 flex-1 items-center justify-center gap-[10px] text-center text-text-default default-body-strong-large',
    trailingSlot:
      'flex h-full w-[104px] shrink-0 items-center justify-end self-stretch py-2',
  },

  modal: {
    container:
      'flex w-[353px] items-center justify-between',
    leadingSlot:
      'flex w-[74px] shrink-0 items-center gap-[10px]',
    leadingContent: 'flex items-center gap-[10px]',
    title:
      'min-w-0 flex-1 truncate text-center text-text-default default-heading-small',
    trailingSlot:
      'flex w-[74px] shrink-0 items-center justify-end',
  },
} as const;

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
        className={`${style.leadingContent} border-0 bg-transparent p-0`}
      >
        <img
          src={icon.leading}
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
          className="flex items-center justify-center border-0 bg-transparent p-0"
        >
          <img
            src={icon.menu}
            className="block shrink-0 object-contain"
          />
        </button>
      );
    }

    if (variant === 'daily') {
      return (
        <>
          {/* TODO: 공용 Button 컴포넌트 구현 후 교체 */}
          <span
            role="button"
            tabIndex={0}
            onClick={trailing.onClick}
            className="cursor-pointer whitespace-nowrap text-text-default default-body-large"
          >
            {trailing.text}
          </span>
        </>
      );
    }

    return (
      <>
        {/* TODO: 공용 Button 컴포넌트 구현 후 교체 */}
        <span
          role="button"
          tabIndex={0}
          onClick={trailing.onClick}
          className="box-border flex h-9 w-[74px] cursor-pointer items-center justify-center gap-medium whitespace-nowrap px-6 text-text-default default-body-strong-medium"
        >
          {trailing.text}
        </span>
      </>
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