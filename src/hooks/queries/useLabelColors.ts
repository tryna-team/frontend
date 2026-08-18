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
 * 외부 캘린더(구글) 일정이 라벨을 못 찾았을 때 쓸 색.
 *
 * 구글 라벨은 연동되는 순간 서버에서 새로 생기는데, 라벨 목록은 캐시돼 있어 그 라벨이
 * 아직 없는 상태로 일정만 먼저 내려오는 구간이 있다. 그때 기본색(초록)으로 떨어지면
 * 사용자 일정과 구분이 안 되므로, 외부 일정만은 구글 라벨 색으로 떨어지게 한다.
 */
export const EXTERNAL_CALENDAR_FALLBACK_COLOR: LabelColor = 'blue';

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

  /**
   * labelId로 색을 찾는다. 목록을 아직 못 받았거나 없는 라벨이면 기본색으로 떨어진다.
   *
   * sourceType을 함께 넘기면 외부 캘린더 일정은 초록 대신 파랑으로 떨어진다.
   * 연동 직후 라벨 목록이 갱신되기 전까지 구글 일정이 사용자 일정과 같은 색으로
   * 보이는 것을 막기 위함이다.
   */
  const getLabelColor = (
    labelId: number | null | undefined,
    // EventSourceType이 apis/types 안에 세 벌로 갈라져 있고 그중 하나는 사실상 string이라,
    // 호출부마다 타입이 어긋난다. 여기서는 값만 비교하면 되므로 string으로 받는다.
    sourceType?: string,
  ): LabelColor => {
    const found = labelId != null ? colorByLabelId.get(labelId) : undefined;

    if (found) {
      return found;
    }

    return sourceType === 'EXTERNAL_CALENDAR'
      ? EXTERNAL_CALENDAR_FALLBACK_COLOR
      : FALLBACK_LABEL_COLOR;
  };

  return { getLabelColor };
}
