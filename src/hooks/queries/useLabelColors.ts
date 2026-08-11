import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { labelService, toCalendarLabel } from '@/apis/services/labelService';
import type { LabelColor } from '@/components/common/LabelModal/LabelItem';

import { queryKeys } from './queryKeys';

/**
 * 라벨이 없거나 아직 못 불러온 일정에 쓸 색.
 * 서버의 기본 라벨도 GREEN이라 값을 맞춰뒀다.
 */
export const FALLBACK_LABEL_COLOR: LabelColor = 'green';

/**
 * labelId → 라벨 색상 매핑.
 *
 * 캘린더(B101)와 데일리(B103) 응답은 labelId만 주기 때문에, 색을 그리려면 라벨
 * 목록(B108)과 이어야 한다. 검색(B107)은 응답에 label 객체가 통째로 들어와서
 * 이 훅이 필요 없다.
 *
 * queryKey를 라벨 목록 시트와 공유하므로, 시트를 이미 열어봤다면 추가 요청 없이
 * 캐시에서 바로 채워진다.
 */
export function useLabelColors() {
  const { data } = useQuery({
    queryKey: queryKeys.labels.list(),
    queryFn: labelService.getLabels,
    // 라벨은 사용자가 직접 바꾸기 전엔 변하지 않으므로 자주 다시 부를 이유가 없다
    staleTime: 5 * 60 * 1000,
  });

  const colorByLabelId = useMemo(() => {
    const map = new Map<number, LabelColor>();

    for (const label of data?.labels ?? []) {
      map.set(label.labelId, toCalendarLabel(label).color);
    }

    return map;
  }, [data]);

  /** labelId가 없거나 아직 목록을 못 받았으면 기본 색을 돌려준다 */
  const getLabelColor = (labelId: number | null | undefined): LabelColor =>
    (labelId != null ? colorByLabelId.get(labelId) : undefined) ?? FALLBACK_LABEL_COLOR;

  return { getLabelColor };
}
