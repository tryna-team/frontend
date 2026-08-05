import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Header from '@/components/common/Header/Header';
import ActionRow from '@/components/common/ActionRow/ActionRow';
import type { LabelColor } from '@/components/common/ActionRow/ActionRow.constant';
import { useCalendarStore } from '@/stores';
import type { CalendarLabel } from '@/stores/types';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { labelService, toCalendarLabel } from '@/apis/services/labelService';

// 테스트를 위한 임시 데이터 — B108-1 API 응답이 비어있거나 호출에 실패하면 이 목록으로 대체한다.
// 실제 라벨 API가 안정적으로 연동되면 이 폴백은 제거해야 한다.
const MOCK_LABELS: CalendarLabel[] = [
  { labelId: 1, externalCalendarId: null, name: '트라이나', labelType: 'USER', color: 'yellow', isDefault: true, isVisible: true, sortOrder: 0 },
  { labelId: 2, externalCalendarId: null, name: '동아리', labelType: 'USER', color: 'pink', isDefault: false, isVisible: true, sortOrder: 1 },
  { labelId: 3, externalCalendarId: null, name: 'UMC', labelType: 'USER', color: 'apricot', isDefault: false, isVisible: true, sortOrder: 2 },
  { labelId: 4, externalCalendarId: null, name: '학교', labelType: 'USER', color: 'purple', isDefault: false, isVisible: true, sortOrder: 3 },
];

type LabelListSheetProps = {
  onClose: () => void;
  onSelectLabel: (label: CalendarLabel) => void;
};

// 피그마 "1-6. 홈/라벨 수정" — 라벨 목록. 각 행을 누르면 라벨 수정 화면(LabelEditSheet)으로 이동.
export default function LabelListSheet({
  onClose,
  onSelectLabel,
}: LabelListSheetProps) {
  const labels = useCalendarStore((s) => s.labels);
  const setLabels = useCalendarStore((s) => s.setLabels);

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

        <ContentBox title="tryna" variant="bottom">
          {labels.map((label) => (
            <ActionRow
              key={label.labelId}
              leading={{
                type: 'icon-text',
                text: label.name,
                color: label.color as LabelColor,
              }}
              accessory={{ type: 'chevron' }}
              onClick={() => onSelectLabel(label)}
            />
          ))}
        </ContentBox>
      </Frame>
    </Overlay>
  );
}
