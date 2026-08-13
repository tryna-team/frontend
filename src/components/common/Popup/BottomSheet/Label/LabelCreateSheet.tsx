import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Input from '@/components/common/Input/Input';
import ColorPicker from '@/components/common/ColorPicker/ColorPicker';
import Button from '@/components/common/Buttons/Button';
import type { LabelColor } from '@/components/common/ActionRow/ActionRow.constant';
import { useCreateModalViewport } from '@/components/common/CreateModal/hooks/useViewport';
import { useCalendarStore } from '@/stores';
import type { CalendarLabel } from '@/stores/types';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { LabelListResponseData } from '@/apis/types/label';
import { labelService, toCalendarLabel, toLabelColorCode } from '@/apis/services/labelService';

// 피그마 "1-10. 홈/일반 라벨 추가"에서 선택돼 있는 기본 색상(색상 배열의 4번째, pink)
const DEFAULT_COLOR: LabelColor = 'pink';

type LabelCreateSheetProps = {
  onClose: () => void;
  // 코드래빗 리뷰 반영: 생성된 라벨을 돌려줘야 이벤트 생성 흐름(CreateModal)에서
  // 방금 만든 라벨을 바로 선택할 수 있다.
  onComplete: (created: CalendarLabel) => void;
};

// 피그마 "1-10. 홈/일반 라벨 추가" — 이벤트 생성 흐름의 "새로운 레이블"(CreateModal)과
// 라벨 설정 화면(LabelListSheet)의 "라벨 추가" 양쪽에서 공유하는 라벨 생성 시트.
export default function LabelCreateSheet({ onClose, onComplete }: LabelCreateSheetProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<LabelColor>(DEFAULT_COLOR);

  const upsertLabel = useCalendarStore((s) => s.upsertLabel);
  const labels = useCalendarStore((s) => s.labels);
  const queryClient = useQueryClient();
  // body로 포털되면 모바일 프레임 컨테이너를 벗어나므로 프레임 크기를 직접 적용해 기존 레이아웃을 유지한다.
  const { visualViewportRect, appFrameRect } = useCreateModalViewport();

  const trimmedName = name.trim();
  const hasInput = trimmedName.length > 0;
  // 라벨_정책서 §5.2: 공백만 있는 이름, 중복 이름(정규화 기준) 금지 — LabelEditSheet와 동일 규칙
  const isDuplicateName = labels.some((l) => l.name.trim() === trimmedName);
  const nameError = hasInput && isDuplicateName ? '이미 사용 중인 라벨 이름이에요.' : null;

  // B108-2 라벨 생성 — POST /api/v1/labels
  const createMutation = useMutation({
    mutationFn: () =>
      labelService.createLabel({ name: trimmedName, color: toLabelColorCode(color) }),
    onSuccess: (created) => {
      const createdLabel = toCalendarLabel(created);
      upsertLabel(createdLabel);
      queryClient.setQueryData<LabelListResponseData>(queryKeys.labels.list(), (old) =>
        old ? { labels: [...old.labels, created] } : { labels: [created] },
      );
      onComplete(createdLabel);
    },
  });

  // 우측 버튼: 이름을 입력하지 않았으면 "닫기"(취소와 동일하게 그냥 닫기),
  // 입력이 있으면 "완료"로 바뀌어 저장을 수행한다(이번 확인 답변 기준).
  const handleTrailingClick = () => {
    if (!hasInput) {
      onClose();
      return;
    }
    if (nameError || createMutation.isPending) return;
    createMutation.mutate();
  };

  return createPortal(
    <Overlay onClick={onClose}>
      <div
        className="absolute flex items-end justify-center"
        style={{
          left: appFrameRect.left,
          width: appFrameRect.width,
          top: visualViewportRect.top,
          height: visualViewportRect.height,
        }}
      >
        <Frame className="h-[92%] gap-6 p-4">
          {/* Header 공용 컴포넌트는 leading이 항상 아이콘(챕터론)이라 이 화면의
              "취소(텍스트)/닫기·완료(pill 버튼)" 조합과 맞지 않아 이 화면만 직접 구성 */}
          <div className="flex w-[353px] items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="flex w-[74px] shrink-0 items-center default-body-strong-medium text-text-default"
            >
              취소
            </button>

            <h1 className="min-w-0 flex-1 truncate text-center text-text-default default-heading-small">
              새로운 라벨
            </h1>

            <div className="flex w-[74px] shrink-0 items-center justify-end">
              <Button
                type="button"
                variant="MediumDefaultFit"
                onClick={handleTrailingClick}
                disabled={hasInput && (!!nameError || createMutation.isPending)}
              >
                {hasInput ? '완료' : '닫기'}
              </Button>
            </div>
          </div>

          {/* dvh 기준 고정 높이 대신 %로 잡은 Frame 안에서, 키보드로 줄어든 실제
              높이보다 콘텐츠가 길어지면 이 영역만 스크롤되고 헤더는 항상 보이게 한다. */}
          <div className="flex w-full flex-1 flex-col gap-6 overflow-y-auto">
            <div className="w-full rounded-medium bg-background-white p-3 shadow-[0px_4px_8px_rgba(0,0,0,0.04),0px_9.701px_29.104px_rgba(0,0,0,0.1)]">
              <Input
                value={name}
                onChange={setName}
                onClear={() => setName('')}
                placeholder="라벨 이름"
                ariaLabel="라벨 이름"
              />
              {nameError && (
                <p className="pl-1 pt-1 text-danger-200 default-caption-large">{nameError}</p>
              )}
              {createMutation.isError && (
                <p className="pl-1 pt-1 text-danger-200 default-caption-large">
                  라벨을 만들지 못했어요. 다시 시도해주세요.
                </p>
              )}
            </div>

            <ContentBox title="색상" variant="bottom">
              <ColorPicker selectedColor={color} onSelect={setColor} />
            </ContentBox>
          </div>
        </Frame>
      </div>
    </Overlay>,
    document.body,
  );
}
