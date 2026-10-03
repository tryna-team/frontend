import type { ReactNode } from 'react';

// # 상수 영역
const BOX_SHADOW =
  'shadow-[0px_4px_8px_rgba(0,0,0,0.04),0px_9.701px_29.104px_rgba(0,0,0,0.1)]';

// # 타입 영역
type BottomSheetBoxProps = {
  title?: string;
  children: ReactNode;
};

type BoxHeaderProps = {
  title: string;
};

type BoxBodyProps = {
  hasHeader: boolean;
  children: ReactNode;
};

// # 함수 영역
// ## header function
function BoxHeader({ title }: BoxHeaderProps) {
  return (
    <div className="flex w-full items-center pt-padding-small pl-padding-medium">
      <p className="default-body-medium w-full flex-1 text-text-additional">
        {title}
      </p>
    </div>
  );
}

// ## body function
function getBodyPadding(hasHeader: boolean): string {
  return hasHeader ? 'px-padding-small' : 'p-padding-small';
}

function BoxBody({ hasHeader, children }: BoxBodyProps) {
  const padding = getBodyPadding(hasHeader);

  return (
    <div className={`flex w-full flex-col items-start ${padding}`}>
      {children}
    </div>
  );
}

// # main component
export default function BottomSheetBox({
  title,
  children,
}: BottomSheetBoxProps) {
  const hasHeader = Boolean(title);

  return (
    <div
      className={`
        flex w-full flex-col items-start rounded-medium bg-background-white
        ${hasHeader ? 'gap-medium pb-padding-xxsmall' : ''}
        ${BOX_SHADOW}
        last:shadow-none
      `}
    >
      {/* Header */}
      {title && <BoxHeader title={title} />}

      {/* Body */}
      <BoxBody hasHeader={hasHeader}>{children}</BoxBody>
    </div>
  );
}