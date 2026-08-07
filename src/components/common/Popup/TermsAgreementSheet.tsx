import { useId, useState } from 'react';

import Button from '@/components/common/Buttons/Button';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import Overlay from '@/components/common/Popup/Overlay';
import type { TermType } from '@/apis/types/auth';

/**
 * 약관 동의 바텀시트.
 *
 * 신규 가입 시 백엔드가 TERMS_400을 주면 띄운다 — 로그인 실패가 아니라
 * "필수 약관 동의를 받아오라"는 신호다. 동의한 유형을 A105/A106의 agreedTermTypes로 넘긴다.
 *
 * ⚠️ 아직 피그마 디자인이 없어 기존 바텀시트(Frame/Overlay) 구조를 따라 최소 형태로 만들었다.
 * 디자인이 나오면 레이아웃만 교체하면 되고, 동의 상태 관리 로직은 그대로 쓸 수 있다.
 * ⚠️ 약관 전문 링크가 아직 없다. 실제 서비스 오픈 전에는 각 항목에서 전문을 볼 수 있어야 한다.
 */

interface TermOption {
  type: TermType;
  label: string;
  required: boolean;
}

const TERM_OPTIONS: TermOption[] = [
  { type: 'SERVICE', label: '서비스 이용약관', required: true },
  { type: 'PRIVACY', label: '개인정보 처리방침', required: true },
  { type: 'LOCATION', label: '위치정보 이용약관', required: false },
];

const REQUIRED_TYPES = TERM_OPTIONS.filter((option) => option.required).map(
  (option) => option.type,
);

interface TermsAgreementSheetProps {
  isPending?: boolean;
  onAgree: (agreedTermTypes: TermType[]) => void;
  onClose: () => void;
}

export default function TermsAgreementSheet({
  isPending = false,
  onAgree,
  onClose,
}: TermsAgreementSheetProps) {
  const titleId = useId();
  const [agreed, setAgreed] = useState<TermType[]>([]);

  const isAllChecked = TERM_OPTIONS.every((option) => agreed.includes(option.type));
  const canSubmit = REQUIRED_TYPES.every((type) => agreed.includes(type));

  const toggle = (type: TermType) => {
    setAgreed((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  };

  const toggleAll = () => {
    setAgreed(isAllChecked ? [] : TERM_OPTIONS.map((option) => option.type));
  };

  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      <Frame className="gap-6 px-5 pt-5 pb-8" aria-labelledby={titleId}>
        <div className="flex w-full flex-col gap-4">
          <p id={titleId} className="default-heading-small w-full text-text-default">
            약관에 동의해주세요
          </p>

          <label className="flex w-full items-center gap-3 border-b border-divider-default pb-4">
            <input
              type="checkbox"
              checked={isAllChecked}
              onChange={toggleAll}
              className="size-5 shrink-0 accent-icon-default"
            />
            <span className="default-body-large text-text-default">전체 동의</span>
          </label>

          <div className="flex w-full flex-col gap-3">
            {TERM_OPTIONS.map((option) => (
              <label key={option.type} className="flex w-full items-center gap-3">
                <input
                  type="checkbox"
                  checked={agreed.includes(option.type)}
                  onChange={() => toggle(option.type)}
                  className="size-5 shrink-0 accent-icon-default"
                />
                <span className="default-body-medium text-text-default">
                  {option.required ? '(필수) ' : '(선택) '}
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-center justify-center gap-3">
          <Button
            variant="LargeDefaultRegular"
            className="w-full"
            disabled={!canSubmit || isPending}
            onClick={() => onAgree(agreed)}
          >
            {isPending ? '처리 중...' : '동의하고 시작하기'}
          </Button>
          <Button variant="Small" onClick={onClose}>
            다음에 하기
          </Button>
        </div>
      </Frame>
    </Overlay>
  );
}
