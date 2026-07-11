import { ChevronRight, Plus, Trash2, X } from "lucide-react";

import { HeroButton } from "./index";

export default function HeroButtonExample() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <section className="flex flex-col gap-3">
        <h2 className="default-body-strong-large text-text-default">Text</h2>
        <div className="flex flex-wrap items-center gap-3">
          <HeroButton size="large">Large</HeroButton>
          <HeroButton size="medium">Medium</HeroButton>
          <HeroButton size="small" surface="ghost" radius="none">
            Small
          </HeroButton>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="default-body-strong-large text-text-default">Symbol + Text</h2>
        <div className="flex flex-wrap items-center gap-3">
          <HeroButton content="symbolText" size="large" symbol={<Plus />}>
            추가하기
          </HeroButton>
          <HeroButton
            content="symbolText"
            size="medium"
            symbol={<ChevronRight />}
            symbolPosition="end"
            width="regular"
          >
            다음
          </HeroButton>
          <HeroButton content="symbolText" size="medium" textColor="warning" symbol={<Trash2 />}>
            삭제
          </HeroButton>
          <HeroButton content="symbolText" size="medium" symbol={<X />} disabled>
            비활성
          </HeroButton>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="default-body-strong-large text-text-default">Symbol</h2>
        <div className="flex flex-wrap items-center gap-3">
          <HeroButton content="symbol" size="large" symbol={<Plus />} aria-label="추가" />
          <HeroButton content="symbol" size="medium" symbol={<X />} aria-label="닫기" />
          <HeroButton
            content="symbol"
            size="small"
            surface="ghost"
            radius="full"
            symbol={<ChevronRight />}
            aria-label="다음"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="default-body-strong-large text-text-default">Width</h2>
        <div className="flex w-full flex-col gap-3">
          <HeroButton width="fit">Fit</HeroButton>
          <HeroButton width="regular">Regular</HeroButton>
          <HeroButton width="full">Full</HeroButton>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="default-body-strong-large text-text-default">Pressed</h2>
        <div className="flex flex-wrap items-center gap-3">
          <HeroButton aria-pressed>Filled pressed</HeroButton>
          <HeroButton surface="ghost" aria-pressed>
            Ghost pressed
          </HeroButton>
        </div>
      </section>
    </div>
  );
}
