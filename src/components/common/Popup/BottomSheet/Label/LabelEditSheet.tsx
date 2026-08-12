import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Header from '@/components/common/Header/Header';
import Input from '@/components/common/Input/Input';
import ColorPicker from '@/components/common/ColorPicker/ColorPicker';
import QuickModal from '@/components/common/Popup/QuickModal';
import ToastPopup from '@/components/common/Popup/ToastPopup';
import Button from '@/components/common/Buttons/Button';
import type { LabelColor } from '@/components/common/ActionRow/ActionRow.constant';
import { useCalendarStore } from '@/stores';
import type { CalendarLabel } from '@/stores/types';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { LabelListResponseData } from '@/apis/types/label';
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
  // 외부 캘린더 연동으로 생긴 라벨(labelType==='EXTERNAL_CALENDAR')은 이름이 연동된 계정에
  // 고정돼 있어 수정할 수 없고, 삭제도 할 수 없다(피그마 "1-9. 홈/라벨 수정" 참고 —
  // 이름 자리에 읽기 전용 텍스트만 있고 하단 삭제 버튼이 없음). B108-3/4 명세도 동일
  // (외부 라벨은 name 필드를 보낼 수 없고, 삭제 API 대상이 아님).
  const isExternal = label.labelType === 'EXTERNAL_CALENDAR';

  const [name, setName] = useState(label.name);
  const [color, setColor] = useState<LabelColor>(label.color as LabelColor);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteErrorOpen, setIsDeleteErrorOpen] = useState(false);

  const upsertLabel = useCalendarStore((s) => s.upsertLabel);
  const removeLabel = useCalendarStore((s) => s.removeLabel);
  // ⚠️ 버그였던 지점: 셀렉터에서 .filter()로 매 렌더 새 배열을 반환하면, zustand가
  // 참조가 바뀌었다고 보고 다시 렌더 → 셀렉터 재실행 → 또 새 배열... 무한 루프에 빠져
  // "Maximum update depth exceeded"로 앱 전체가 크래시한다. 원본 배열(참조가 실제로
  // 바뀔 때만 갱신됨)만 구독하고, 제외 필터링은 아래 isDuplicateName 계산 안에서 한다.
  const labels = useCalendarStore((s) => s.labels);
  const queryClient = useQueryClient();

  // 라벨_정책서 §5.2/§6: 이름의 앞뒤 공백을 제거하고, 공백만 있는 이름과 동일 사용자 내
  // 중복 이름(정규화 기준)을 금지한다. B108-2/B108-3의 400/409 응답과 대응된다.
  // 외부 라벨은 이름을 수정하지 않으므로 이 검증 자체가 필요 없다.
  const trimmedName = name.trim();
  const isNameEmpty = trimmedName.length === 0;
  const isDuplicateName = labels.some(
    (l) => l.labelId !== label.labelId && l.name.trim() === trimmedName,
  );
  const nameError = isExternal
    ? null
    : isNameEmpty
      ? '라벨 이름을 입력해주세요.'
      : isDuplicateName
        ? '이미 사용 중인 라벨 이름이에요.'
        : null;

  const isDirty = (!isExternal && trimmedName !== label.name) || color !== label.color;
  const canSubmit = isDirty && !nameError;

  // B108-3 라벨 수정 — PATCH /api/v1/labels/{labelId}
  const updateMutation = useMutation({
    mutationFn: () =>
      labelService.updateLabel(label.labelId, {
        ...(isExternal ? {} : { name: trimmedName }),
        color: toLabelColorCode(color),
      }),
  });

  const handleComplete = () => {
    if (!canSubmit) return;

    updateMutation.mutate(undefined, {
      onSuccess: (updated) => {
        upsertLabel(toCalendarLabel(updated));

        // 코드래빗 리뷰 반영: LabelListSheet는 calendarStore.labels가 아니라
        // queryKeys.labels.list() 캐시를 기준으로 다시 채워지므로, 위 upsertLabel만으로는
        // 부족하다 — staleTime(1분) 안에 목록으로 돌아가면 옛 캐시가 방금 한 수정을 덮어씀.
        // 여기서 캐시도 같이 패치해서 그 문제를 막는다.
        queryClient.setQueryData<LabelListResponseData>(
          queryKeys.labels.list(),
          (old) =>
            old && {
              labels: old.labels.map((l) => (l.labelId === updated.labelId ? updated : l)),
            },
        );

        onComplete();
      },
    });
  };

  // B108-4 라벨 삭제 — DELETE /api/v1/labels/{labelId}
  const deleteMutation = useMutation({
    mutationFn: () => labelService.deleteLabel(label.labelId),
    onSuccess: () => {
      removeLabel(label.labelId);

      // 버그였던 지점: invalidateQueries만 쓰면 캐시는 "오래됨" 표시만 되고 즉시 갱신되지
      // 않는다. onBack() 직후 LabelListSheet가 곧바로 다시 마운트되면서, 아직 갱신 안 된
      // (삭제된 라벨이 남아있는) 옛 캐시를 그대로 읽어 setLabels에 넘겨버려서, 위
      // removeLabel이 스토어에서 이미 지운 걸 다시 덮어썼다 — 삭제됐는데 화면엔 남아있는
      // 것처럼 보인 원인. updateMutation처럼 캐시를 즉시(동기) 패치해서 이 경쟁을 없앤다.
      queryClient.setQueryData<LabelListResponseData>(
        queryKeys.labels.list(),
        (old) =>
          old && {
            labels: old.labels.filter((l) => l.labelId !== label.labelId),
          },
      );
      // 기본 라벨 재지정 등 남은 라벨들의 세부 필드까지 서버 기준으로 맞추기 위해
      // 위 동기 패치와 별개로 백그라운드 재조회도 함께 트리거해둔다.
      queryClient.invalidateQueries({ queryKey: queryKeys.labels.list() });
      setIsDeleteConfirmOpen(false);
      onBack();
    },
    // 코드래빗 리뷰 반영: 실패해도 QuickModal이 그대로 떠 있고 아무 안내가 없던 문제 —
    // EventViewPage.tsx의 일정 삭제 실패와 동일하게 확인 모달을 닫고 토스트로 안내한다.
    onError: () => {
      setIsDeleteConfirmOpen(false);
      setIsDeleteErrorOpen(true);
    },
  });

  // EventViewPage.tsx의 handleDelete와 동일한 방식: 응답이 오기 전에 다시 누르면
  // DELETE가 중복으로 나간다 — 이미 삭제된 labelId에 대고 또 요청하게 돼 위험하다.
  const handleDeleteLabel = () => {
    if (deleteMutation.isPending) {
      return;
    }

    deleteMutation.mutate();
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

        {isExternal ? (
          // 외부 라벨은 이름 대신 연동된 계정 이름을 읽기 전용으로 보여준다(수정 불가)
          <div className="w-full px-4 py-3">
            <p className="default-body-large text-text-default">{label.name}</p>
          </div>
        ) : (
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
            {/* 코드래빗 리뷰 반영: 실패해도 화면에 아무 표시가 없어서(특히 로컬처럼 백엔드가
                없는 환경에서) "완료"를 눌러도 멈춘 것처럼 보이던 문제 — 실패 안내 추가 */}
            {updateMutation.isError && (
              <p className="pl-1 pt-1 text-danger-200 default-caption-large">
                라벨을 저장하지 못했어요. 다시 시도해주세요.
              </p>
            )}
          </div>
        )}

        <ContentBox title="색상" variant={isExternal ? 'bottom' : 'default'}>
          <ColorPicker selectedColor={color} onSelect={setColor} />
        </ContentBox>

        {/* 외부 라벨은 삭제할 수 없음(위 isExternal 설명 참고) — tryna 라벨에만 노출 */}
        {!isExternal && (
          <Button
            variant="LargeWarningRegular"
            className="w-full"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            라벨 삭제
          </Button>
        )}
      </Frame>

      {isDeleteConfirmOpen && (
        <QuickModal
          message="이 라벨을 삭제하시겠습니까?"
          primaryAction={{
            text: '라벨 삭제',
            onClick: handleDeleteLabel,
          }}
          onClose={() => setIsDeleteConfirmOpen(false)}
        />
      )}

      {isDeleteErrorOpen && (
        <ToastPopup
          GuideText="라벨을 삭제하지 못했어요."
          DetailText="잠시 후 다시 시도해주세요."
          onClose={() => setIsDeleteErrorOpen(false)}
        />
      )}
    </Overlay>
  );
}
