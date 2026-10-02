import type { ReactNode } from 'react';

// # 상수 영역
const BOX_SHADOW = 'shadow-[0px_4px_8px_rgba(0,0,0,0.04),0px_9.701px_29.104px_rgba(0,0,0,0.1)]';

// # 타입 영역
type BottomSheetBoxProps = {
  title?: string;
  children: ReactNode;
}

type BoxHeaderProps = {
  title: string;
};

type BoxBodyProps = {
  children: ReactNode;
};


// # 함수 영역
function BoxHeader({ title }: BoxHeaderProps) {
  return (
    <div className="flex w-full items-center justify-center pt-3 pl-4">
      <p className="default-body-medium w-full flex-1 text-text-additional">{title}</p>
    </div>
  );
}

function BoxBody({ children }: BoxBodyProps) {
  return <div className="flex w-full flex-col items-start px-3">{children}</div>;
}

// # main component
export default function BottomSheetBox({ title, children }: BottomSheetBoxProps) {
  return (
    <div
      className= {`
        flex w-full flex-col items-start gap-3 rounded-medium
        bg-background-white pb-1
        ${BOX_SHADOW}
        last:shadow-none
      `}
    >
      {/* Header */}
      {title && <BoxHeader title={title} />}
      
      {/* Body */}
      <BoxBody>{children}</BoxBody>
    </div>
  );
}