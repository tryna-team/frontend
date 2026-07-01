import { ChevronLeft, Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';

type HeaderProps = {
  title: string;
  leftText?: string;
  rightText?: string;
  showMenuButton?: boolean;
};

export default function Header({
  title,
  leftText,
  rightText,
  showMenuButton = false,
}: HeaderProps) {
  return (
    <header className="relative flex h-[52px] w-full max-w-[393px] items-center justify-between border-b border-[#EDEDF2] bg-white px-5">
      <Button
        type="button"
        variant="ghost"
        className="flex h-[25px] w-[104px] items-center justify-start gap-2 p-0 text-[#201A36] hover:bg-transparent"
        aria-label="왼쪽 버튼"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />

        {leftText && (
          <span className="flex h-[26px] w-[72px] items-center text-[17px] font-medium leading-6 tracking-[-0.43px]">
            {leftText}
          </span>
        )}
      </Button>

      <h1 className="absolute left-1/2 flex h-[26px] w-[157px] -translate-x-1/2 items-center justify-center gap-[10px] text-center text-[17px] font-semibold leading-6 tracking-[-0.43px] text-[#201A36]">
        {title}
      </h1>

      <div className="flex h-6 w-[104px] items-center justify-end gap-[10px]">
        {showMenuButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-[#201A36] hover:bg-transparent"
            aria-label="메뉴 버튼"
          >
            <Menu className="h-6 w-6" strokeWidth={2.2} />
          </Button>
        ) : rightText ? (
          <Button
            type="button"
            variant="ghost"
            className="h-6 w-[104px] justify-end p-0 text-[17px] font-medium leading-6 tracking-[-0.43px] text-[#201A36] hover:bg-transparent"
            aria-label="오른쪽 버튼"
          >
            {rightText}
          </Button>
        ) : null}
      </div>
    </header>
  );
}