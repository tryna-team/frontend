import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Header from '@/components/common/Header/Header';
import ActionRow from '@/components/common/ActionRow/ActionRow';
import type { LabelColor } from '@/components/common/ActionRow/ActionRow.constant';
import { useCalendarStore } from '@/stores';
import type { CalendarLabel } from '@/stores/types';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { LabelListResponseData } from '@/apis/types/label';
import { labelService, toCalendarLabel } from '@/apis/services/labelService';

// 테스트를 위한 임시 데이터 — B108-1 API 응답이 비어있거나 호출에 실패하면 이 목록으로 대체한다.
// 실제 라벨 API가 안정적으로 연동되면 이 폴백은 제거해야 한다.
const MOCK_LABELS: CalendarLabel[] = [
  { labelId: 1, externalCalendarId: null, name: '트라이나', labelType: 'USER', color: 'yellow', isDefault: true, isVisible: true, sortOrder: 0 },
  { labelId: 2, externalCalendarId: null, name: '동아리', labelType: 'USER', color: 'pink', isDefault: false, isVisible: true, sortOrder: 1 },
  { labelId: 3, externalCalendarId: null, name: 'UMC', labelType: 'USER', color: 'apricot', isDefault: false, isVisible: true, sortOrder: 2 },
  { labelId: 4, externalCalendarId: null, name: '학교', labelType: 'USER', color: 'purple', isDefault: false, isVisible: false, sortOrder: 3 },
];

// Long Press로 순서를 바꾸는 동안, 행 하나를 몇 px 눌러야 다음 순서로 넘어가는지
// 판단하는 기준 — ActionRow 한 행의 높이(h-[52px])와 맞춘다.
const ROW_HEIGHT = 52;
// 이 거리 이상 움직이기 전까지는 "누르는 중"으로 보고, 넘으면 스크롤 의도로 보고
// 롱프레스 타이머를 취소한다.
const DRAG_START_THRESHOLD = 10;
const LONG_PRESS_MS = 400;

function arrayMoveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

type LabelListSheetProps = {
  onClose: () => void;
  onSelectLabel: (label: CalendarLabel) => void;
  onCreateLabel: () => void;
};

// 피그마 "1-6. 홈/라벨 수정" — 라벨 목록. 각 행을 누르면 라벨 수정 화면(LabelEditSheet)으로 이동.
export default function LabelListSheet({
  onClose,
  onSelectLabel,
  onCreateLabel,
}: LabelListSheetProps) {
  const labels = useCalendarStore((s) => s.labels);
  const setLabels = useCalendarStore((s) => s.setLabels);
  const upsertLabel = useCalendarStore((s) => s.upsertLabel);
  const queryClient = useQueryClient();

  const { data, isError } = useQuery({
    queryKey: queryKeys.labels.list(),
    queryFn: labelService.getLabels,
  });

  useEffect(() => {
    if (data) {
      const mapped = data.labels.map(toCalendarLabel);
      // 테스트를 위한 임시 데이터 — 응답이 비어있으면(로컬에 실 백엔드가 없는 경우 등) mock으로 대체
      setLabels(mapped.length > 0 ? mapped : MOCK_LABELS);
    } else if (isError) {
      // 테스트를 위한 임시 데이터 — API 호출 자체가 실패하면 mock으로 대체
      setLabels(MOCK_LABELS);
    }
  }, [data, isError, setLabels]);

  // 피그마 "1-6" 두 variant(계정 연동 전/후) 대응: Gmail 섹션은 외부 캘린더 연동으로 생긴
  // 라벨(labelType==='EXTERNAL_CALENDAR')이 하나라도 있을 때만 표시한다.
  const externalLabels = labels
    .filter((l) => l.labelType === 'EXTERNAL_CALENDAR')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const hasExternalLabels = externalLabels.length > 0;

  // tryna(사용자) 라벨만 Long Press로 순서를 바꿀 수 있다. 드래그 중이 아닐 때는 항상
  // 스토어 값을 그대로 반영하고, 드래그 중에는 로컬에서만 순서를 바꿔 보여준다.
  const [userLabelOrder, setUserLabelOrder] = useState<CalendarLabel[]>([]);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setUserLabelOrder(
      labels.filter((l) => l.labelType === 'USER').sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }, [labels]);

  // B108-3 라벨 수정(표시/숨김 전용) — ColorPicker 아이콘을 눌렀을 때만 실행
  const visibilityMutation = useMutation({
    mutationFn: ({ labelId, isVisible }: { labelId: number; isVisible: boolean }) =>
      labelService.updateLabel(labelId, { isVisible }),
    onSuccess: (updated) => {
      upsertLabel(toCalendarLabel(updated));
      queryClient.setQueryData<LabelListResponseData>(
        queryKeys.labels.list(),
        (old) =>
          old && {
            labels: old.labels.map((l) => (l.labelId === updated.labelId ? updated : l)),
          },
      );
    },
  });

  const handleToggleVisible = (label: CalendarLabel) => {
    if (visibilityMutation.isPending) return;
    visibilityMutation.mutate({ labelId: label.labelId, isVisible: !label.isVisible });
  };

  // B108-5 라벨 순서 변경 — 요청은 "전체 활성 라벨"을 새 순서대로 담아야 한다.
  // Gmail 라벨은 드래그 대상이 아니므로 기존 순서 그대로 앞에 붙이고, 그 뒤에
  // 드래그로 정해진 tryna 라벨 순서를 이어붙인다(화면에도 Gmail 섹션이 위에 나온다).
  const reorderMutation = useMutation({
    mutationFn: (labelIds: number[]) => labelService.reorderLabels({ labelIds }),
    onSuccess: (result) => {
      setLabels(result.labels.map(toCalendarLabel));
      queryClient.setQueryData<LabelListResponseData>(queryKeys.labels.list(), {
        labels: result.labels,
      });
    },
  });

  const commitReorder = (nextOrder: CalendarLabel[]) => {
    const labelIds = [...externalLabels.map((l) => l.labelId), ...nextOrder.map((l) => l.labelId)];
    reorderMutation.mutate(labelIds);
  };

  // ── Long Press → 드래그 정렬 ──
  // 각 행의 눌림을 개별 관리: 타이머가 끝나기 전에 일정 거리 이상 움직이면(스크롤 의도)
  // 취소하고, 끝나면 그 행부터 드래그 모드로 들어간다.
  const pressTimerRef = useRef<number | null>(null);
  const dragRef = useRef<{
    labelId: number;
    startIndex: number;
    startY: number;
    snapshot: CalendarLabel[];
  } | null>(null);
  const suppressNextClickRef = useRef(false);
  const [draggingLabelId, setDraggingLabelId] = useState<number | null>(null);

  const clearPressTimer = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const endDrag = () => {
    isDraggingRef.current = false;
    dragRef.current = null;
    setDraggingLabelId(null);
  };

  const handleRowPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    label: CalendarLabel,
    index: number,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const currentTarget = event.currentTarget;

    clearPressTimer();
    pressTimerRef.current = window.setTimeout(() => {
      pressTimerRef.current = null;
      isDraggingRef.current = true;
      dragRef.current = {
        labelId: label.labelId,
        startIndex: index,
        startY,
        snapshot: userLabelOrder,
      };
      setDraggingLabelId(label.labelId);
      suppressNextClickRef.current = true;
      currentTarget.setPointerCapture(pointerId);
    }, LONG_PRESS_MS);

    // 타이머가 끝나기 전 스크롤성 이동이면 롱프레스 취소
    const cancelIfScrolled = (moveEvent: PointerEvent) => {
      if (dragRef.current) return;
      const dx = Math.abs(moveEvent.clientX - startX);
      const dy = Math.abs(moveEvent.clientY - startY);
      if (dx > DRAG_START_THRESHOLD || dy > DRAG_START_THRESHOLD) {
        clearPressTimer();
        window.removeEventListener('pointermove', cancelIfScrolled);
      }
    };
    window.addEventListener('pointermove', cancelIfScrolled);
    const cleanup = () => window.removeEventListener('pointermove', cancelIfScrolled);
    window.addEventListener('pointerup', cleanup, { once: true });
    window.addEventListener('pointercancel', cleanup, { once: true });
  };

  const handleRowPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    const deltaY = event.clientY - drag.startY;
    const indexDelta = Math.round(deltaY / ROW_HEIGHT);
    const targetIndex = Math.min(
      Math.max(drag.startIndex + indexDelta, 0),
      drag.snapshot.length - 1,
    );
    const currentIndex = drag.snapshot.findIndex((l) => l.labelId === drag.labelId);

    if (targetIndex !== currentIndex) {
      setUserLabelOrder(arrayMoveItem(drag.snapshot, currentIndex, targetIndex));
    }
  };

  const handleRowPointerUp = () => {
    clearPressTimer();
    if (dragRef.current) {
      commitReorder(userLabelOrder);
      endDrag();
    }
  };

  const handleRowClick = (label: CalendarLabel) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    onSelectLabel(label);
  };

  return (
    <Overlay className="flex items-end justify-center" onClick={onClose}>
      {/* 피그마 프레임 높이 비율(788/852 ≈ 92%)에 맞춰 고정 — 콘텐츠 아래 빈 공간 포함 */}
      <Frame className="h-[92dvh] gap-6 p-4">
        <Header
          variant="modal"
          title="라벨"
          leading={{ type: 'none' }}
          trailing={{ type: 'text', text: '닫기', onClick: onClose }}
        />

        {hasExternalLabels && (
          <ContentBox title="Gmail" variant="default">
            {externalLabels.map((label) => (
              <ActionRow
                key={label.labelId}
                leading={{
                  type: 'icon-text',
                  text: label.name,
                  color: label.color as LabelColor,
                  dimmed: !label.isVisible,
                  onIconClick: () => handleToggleVisible(label),
                }}
                accessory={{ type: 'chevron' }}
                onClick={() => onSelectLabel(label)}
              />
            ))}
          </ContentBox>
        )}

        <ContentBox title="tryna" variant="bottom">
          {userLabelOrder.map((label, index) => (
            <div
              key={label.labelId}
              onPointerDown={(e) => handleRowPointerDown(e, label, index)}
              onPointerMove={handleRowPointerMove}
              onPointerUp={handleRowPointerUp}
              onPointerCancel={endDrag}
              className={
                draggingLabelId === label.labelId
                  ? 'touch-none rounded-medium bg-background-white shadow-[0px_4px_8px_rgba(0,0,0,0.08)]'
                  : 'touch-none'
              }
            >
              <ActionRow
                leading={{
                  type: 'icon-text',
                  text: label.name,
                  color: label.color as LabelColor,
                  dimmed: !label.isVisible,
                  onIconClick: () => handleToggleVisible(label),
                }}
                accessory={{ type: 'chevron' }}
                onClick={() => handleRowClick(label)}
              />
            </div>
          ))}

          {/* 피그마 "라벨 추가" 행 — ActionRow의 leading 타입(text/icon-text)에 맞는 프리셋이
              없어(원형 + 아이콘) 이 행만 직접 구성한다. 높이(h-[52px])/패딩(px-1)은 ActionRow와 맞춤 */}
          <button
            type="button"
            onClick={onCreateLabel}
            className="box-border flex h-[52px] w-full min-w-0 items-center gap-3 self-stretch px-1 text-left"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-text-default">
              <span
                aria-hidden="true"
                className="size-3 bg-icon-white"
                style={{
                  WebkitMask: "url('/icon/icons/plus_medium.svg') center / contain no-repeat",
                  mask: "url('/icon/icons/plus_medium.svg') center / contain no-repeat",
                }}
              />
            </span>
            <span className="min-w-0 truncate text-text-default default-body-large">라벨 추가</span>
          </button>
        </ContentBox>
      </Frame>
    </Overlay>
  );
}
