import { useCallback, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { labelService } from '@/apis/services/labelService';
import type { LabelItemData } from '@/components/common/LabelModal/LabelModal';
import { queryKeys } from '@/hooks/queries/queryKeys';

import type { LabelColor, LabelStatus } from './CreateModal.types';

type UseCreateModalLabelsParams = {
  labels: LabelItemData[];
  labelStatus: LabelStatus;
  pendingSelectedLabelId?: number | null;
  isSaving: boolean;
  onSelectLabel?: (id: number) => void;
  onCreateLabel?: () => void;
};

export const useCreateModalLabels = ({
  labels,
  labelStatus,
  pendingSelectedLabelId,
  isSaving,
  onSelectLabel,
  onCreateLabel,
}: UseCreateModalLabelsParams) => {
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(
    labelStatus.type === 'selected' ? labelStatus.id : null,
  );

  // 새 라벨 생성 직후 CreateModal이 계속 마운트되어 있어도 선택 상태를 갱신한다.
  const [appliedPendingLabelId, setAppliedPendingLabelId] = useState(pendingSelectedLabelId);
  if (pendingSelectedLabelId !== appliedPendingLabelId) {
    setAppliedPendingLabelId(pendingSelectedLabelId);
    if (pendingSelectedLabelId != null) {
      setSelectedLabelId(pendingSelectedLabelId);
    }
  }

  const { data: labelData } = useQuery({
    queryKey: queryKeys.labels.list(),
    queryFn: labelService.getLabels,
  });

  const apiLabels = useMemo<LabelItemData[]>(
    () =>
      (labelData?.labels ?? [])
        .filter((label) => label.isVisible)
        .map((label) => ({
          id: label.labelId,
          label: label.name,
          color: label.color.toLowerCase() as LabelColor,
        })),
    [labelData],
  );
  const selectableLabels = useMemo(
    () => Array.from(new Map([...labels, ...apiLabels].map((label) => [label.id, label])).values()),
    [apiLabels, labels],
  );
  const selectedLabel = selectableLabels.find((label) => label.id === selectedLabelId);

  const handleSelectLabel = useCallback(
    (id: number) => {
      if (isSaving) {
        return;
      }

      setSelectedLabelId(id);
      setIsLabelModalOpen(false);
      onSelectLabel?.(id);
    },
    [isSaving, onSelectLabel],
  );

  const handleCreateLabel = useCallback(() => {
    if (isSaving) {
      return;
    }

    setIsLabelModalOpen(false);
    onCreateLabel?.();
  }, [isSaving, onCreateLabel]);

  return {
    isLabelModalOpen,
    setIsLabelModalOpen,
    selectedLabelId,
    apiLabels,
    selectableLabels,
    selectedLabel,
    handleSelectLabel,
    handleCreateLabel,
  };
};
