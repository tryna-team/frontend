import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Header from '@/components/common/Header/Header';
import Input from '@/components/common/Input/Input';
import ColorPicker from '@/components/common/ColorPicker/ColorPicker';
import type { LabelColor } from '@/components/common/ActionRow/ActionRow.constant';
import { useCalendarStore } from '@/stores';
import type { CalendarLabel } from '@/stores/types';
import {
  labelService,
  toCalendarLabel,
  toLabelColorCode,
} from '@/apis/services/labelService';

type LabelEditSheetProps = {
  label: CalendarLabel;
  onBack: () => void;
  onComplete: () => void;
};

// 피그마 "1-7. 홈/일반 라벨 수정" · "1-7. 홈/외부 라벨 수정" · "1-9. 홈/라벨 수정 완료" 공용 구현.
export default function LabelEditSheet({
  label,
  onBack,
  onComplete,
}: LabelEditSheetProps) {
  // 원래 여기에 `const isNameEditable = label.source === 'tryna';`가 있었음
  // (source: 'tryna'|'external'로 일반/외부 라벨을 구분해 이름 수정 가능 여부를 갈랐음).
  // origin/dev 병합으로 CalendarLabel에서 source가 사라지고 isDefault/isVisible/sortOrder로
  // 재정의되면서, "일반/외부"를 구분할 필드 자체가 없어짐(정책서상 외부 라벨은 Post-MVP라
  // 현재 타입엔 반영되지 않음). 대체할 필드가 없어 지금은 라벨 이름을 항상 수정 가능하게
  // 처리함 — 나중에 외부 라벨 개념이 타입에 다시 생기면 이 자리에 분기를 복원할 것.
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState<LabelColor>(label.color as LabelColor);

  const upsertLabel = useCalendarStore((s) => s.upsertLabel);
  const otherLabels = useCalendarStore((s) =>
    s.labels.filter((l) => l.labelId !== label.labelId),
  );

  // 라벨_정책서 §5.2/§6: 이름의 앞뒤 공백을 제거하고, 공백만 있는 이름과 동일 사용자 내
  // 중복 이름(정규화 기준)을 금지한다. B108-2/B108-3의 400/409 응답과 대응된다.
  const trimmedName = name.trim();
  const isNameEmpty = trimmedName.length === 0;
  const isDuplicateName = otherLabels.some((l) => l.name.trim() === trimmedName);
  const nameError = isNameEmpty
    ? '라벨 이름을 입력해주세요.'
    : isDuplicateName
      ? '이미 사용 중인 라벨 이름이에요.'
      : null;

  const isDirty = trimmedName !== label.name || color !== label.color;
  const canSubmit = isDirty && !nameError;

  // B108-3 라벨 수정 — PATCH /api/v1/labels/{labelId}
  const updateMutation = useMutation({
    mutationFn: () =>
      labelService.updateLabel(label.labelId, {
        name: trimmedName,
        color: toLabelColorCode(color),
      }),
  });

  const handleComplete = () => {
    if (!canSubmit) return;

    updateMutation.mutate(undefined, {
      onSuccess: (updated) => {
        upsertLabel(toCalendarLabel(updated));
        onComplete();
      },
    });
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
            disabled: !canSubmit || updateMutation.isPending,
          }}
        />

        {/* 원래 여기가 isNameEditable ? <Input .../> : <p>{label.title}</p> 삼항분기였음
            (외부 라벨이면 이름 대신 읽기 전용 텍스트를 보여줬음). 위 설명대로 그 분기 기준이
            없어져서 지금은 Input만 무조건 렌더링함. */}
        <div className="w-full rounded-medium bg-background-white p-3 shadow-[0px_4px_8px_rgba(0,0,0,0.04),0px_9.701px_29.104px_rgba(0,0,0,0.1)]">
          <Input
            value={name}
            onChange={setName}
            onClear={() => setName('')}
            ariaLabel="라벨 이름"
          />
          {nameError && (
            <p className="pl-1 pt-1 text-danger-200 default-caption-large">{nameError}</p>
          )}
        </div>

        <ContentBox title="색상" variant="bottom">
          <ColorPicker selectedColor={color} onSelect={setColor} />
        </ContentBox>
      </Frame>
    </Overlay>
  );
}
