import { useMemo } from 'react';

import type { ChecklistItemData } from '@/components/common/Checklist/Checklist';
import type { RecommendationCandidate } from '@/stores/types';

import { ADD_CHECKLIST_ITEM_ID } from '../constants';
import type { CreateModalChecklistItem } from '../types';
import { formatChecklistDate } from '../utils/dateTime';

const createManualCandidateId = () =>
  `manual-${
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  }`;

type UseRecommendationChecklistItemsParams = {
  checklistItems: CreateModalChecklistItem[];
  recommendationCandidates: RecommendationCandidate[];
  startDate: Date;
  isSaving: boolean;
  hideRecommendationUnavailable: () => void;
  addManualCandidate: (candidate: RecommendationCandidate) => void;
  editCandidate: (candidateId: string, patch: Partial<RecommendationCandidate>) => void;
  toggleCandidateSelected: (candidateId: string) => void;
  handleOpenRecommendationEdit: (candidate: RecommendationCandidate) => void;
  onAddChecklist?: () => void;
  onToggleChecklist?: (id: number) => void;
};

export function useRecommendationChecklistItems({
  checklistItems,
  recommendationCandidates,
  startDate,
  isSaving,
  hideRecommendationUnavailable,
  addManualCandidate,
  editCandidate,
  toggleCandidateSelected,
  handleOpenRecommendationEdit,
  onAddChecklist,
  onToggleChecklist,
}: UseRecommendationChecklistItemsParams) {
  const renderedChecklistItems = useMemo<ChecklistItemData[]>(() => {
    const hasRecommendationCandidates = recommendationCandidates.length > 0;
    const effectiveChecklistItems = hasRecommendationCandidates
      ? recommendationCandidates.map((candidate, index) => ({
          id: index + 1,
          label: candidate.title,
          status: candidate.selected ? ('add' as const) : ('done' as const),
          itemType: candidate.itemType,
          date: candidate.displayDate ?? undefined,
        }))
      : checklistItems;

    return effectiveChecklistItems.map((item, index) => {
      const status = item.status ?? 'add';
      const hasDateTrailing = status === 'add' || status === 'done';
      const candidate = hasRecommendationCandidates ? recommendationCandidates[index] : undefined;
      const trailingText =
        item.itemType === 'TIMED_ACTION'
          ? formatChecklistDate(item.date, candidate?.displayEndDate, startDate)
          : '당일';

      return {
        id: item.id,
        label: item.label,
        labelContent: candidate ? (
          <input
            data-recommendation-title-input="true"
            aria-label={`${candidate.title || '추천 항목'} 제목 수정`}
            value={candidate.title}
            placeholder={candidate.createdBy === 'USER' ? '하위 목록을 작성하세요' : undefined}
            disabled={isSaving || !candidate.selected}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onChange={(event) =>
              editCandidate(candidate.candidateId, {
                title: event.target.value,
              })
            }
            className="min-w-0 w-full bg-transparent text-left text-text-default outline-none disabled:cursor-default disabled:text-text-disable default-body-large"
          />
        ) : undefined,
        status,
        trailing: hasDateTrailing
          ? {
              type: 'date' as const,
              text: trailingText,
              onClick:
                candidate?.selected && !isSaving
                  ? () => handleOpenRecommendationEdit(candidate)
                  : undefined,
            }
          : {
              type: 'none' as const,
            },
      };
    });
  }, [
    checklistItems,
    editCandidate,
    handleOpenRecommendationEdit,
    isSaving,
    recommendationCandidates,
    startDate,
  ]);

  const directAddChecklistItem = useMemo<ChecklistItemData[]>(
    () => [
      {
        id: ADD_CHECKLIST_ITEM_ID,
        label: '직접 추가',
        status: 'plus',
        trailing: {
          type: 'none',
        },
      },
    ],
    [],
  );

  const handleChecklistClick = (id: number) => {
    if (isSaving) {
      return;
    }

    if (id === ADD_CHECKLIST_ITEM_ID) {
      hideRecommendationUnavailable();
      addManualCandidate({
        candidateId: createManualCandidateId(),
        title: '',
        createdBy: 'USER',
        itemType: 'CHECKLIST',
        apiItemType: 'UNTIMED_PREP',
        sourceTemplateId: null,
        offsetDays: null,
        originalTitle: '',
        displayDate: null,
        displayEndDate: null,
        displayTime: null,
        selected: true,
        edited: false,
      });
      onAddChecklist?.();
      return;
    }

    if (recommendationCandidates.length > 0) {
      const candidate = recommendationCandidates[id - 1];

      if (candidate) {
        toggleCandidateSelected(candidate.candidateId);
      }

      return;
    }

    onToggleChecklist?.(id);
  };

  return {
    renderedChecklistItems,
    directAddChecklistItem,
    handleChecklistClick,
  };
}
