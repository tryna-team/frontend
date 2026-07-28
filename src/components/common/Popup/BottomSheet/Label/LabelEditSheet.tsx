import { useState } from 'react';

import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Header from '@/components/common/Header/Header';
import Input from '@/components/common/Input/Input';
import ColorPicker from '@/components/common/ColorPicker/ColorPicker';
import type { LabelColor } from '@/components/common/ActionRow/ActionRow.constant';
import type { CalendarLabel } from '@/stores/types';

type LabelEditSheetProps = {
  label: CalendarLabel;
  onBack: () => void;
  // TODO: 백엔드(라벨 수정 API) 연동 전까지는 호출부가 원하는 대로 처리(예: mock 목록 갱신).
  onComplete: (updated: { title: string; color: LabelColor }) => void;
};

// 피그마 "1-7. 홈/일반 라벨 수정" · "1-7. 홈/외부 라벨 수정" · "1-9. 홈/라벨 수정 완료" 공용 구현.
// 세 화면 모두 Header + 색상 ContentBox 구조가 동일하고, 차이는 이름 수정 가능 여부(상단 이름 영역)뿐이라
// CalendarLabel.source로 분기 처리함 (source === 'tryna' → 일반/이름 수정 가능, 그 외 → 외부/이름 고정).
export default function LabelEditSheet({
  label,
  onBack,
  onComplete,
}: LabelEditSheetProps) {
  const isNameEditable = label.source === 'tryna';

  const [title, setTitle] = useState(label.title);
  const [color, setColor] = useState<LabelColor>(label.color as LabelColor);

  const isDirty = title !== label.title || color !== label.color;

  const handleComplete = () => {
    if (!isDirty) return;
    onComplete({ title, color });
  };

  return (
    <Overlay className="flex items-end justify-center" onClick={onBack}>
      {/* 피그마 프레임 높이 비율(788/852 ≈ 92%)에 맞춰 고정 — 콘텐츠 아래 빈 공간 포함 */}
      <Frame className="h-[92dvh] gap-6 p-4">
        <Header
          variant="modal"
          title="라벨 수정"
          leading={{ type: 'icon', onClick: onBack }}
          trailing={{
            type: 'text',
            text: '완료',
            onClick: handleComplete,
            disabled: !isDirty,
          }}
        />

        {isNameEditable ? (
          <div className="w-full rounded-medium bg-background-white p-3 shadow-[0px_4px_8px_rgba(0,0,0,0.04),0px_9.701px_29.104px_rgba(0,0,0,0.1)]">
            <Input
              value={title}
              onChange={setTitle}
              onClear={() => setTitle('')}
              ariaLabel="라벨 이름"
            />
          </div>
        ) : (
          <div className="flex w-full items-center justify-center pl-4 pt-3">
            <p className="w-full flex-1 text-text-additional default-body-medium">
              {label.title}
            </p>
          </div>
        )}

        <ContentBox title="색상" variant="bottom">
          <ColorPicker selectedColor={color} onSelect={setColor} />
        </ContentBox>
      </Frame>
    </Overlay>
  );
}
