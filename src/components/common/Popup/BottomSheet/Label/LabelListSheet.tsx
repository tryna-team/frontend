import Overlay from '@/components/common/Popup/Overlay';
import Frame from '@/components/common/Popup/BottomSheet/Layout/Frame';
import ContentBox from '@/components/common/Popup/BottomSheet/Layout/ContentBox';
import Header from '@/components/common/Header/Header';
import ActionRow from '@/components/common/ActionRow/ActionRow';
import type { LabelColor } from '@/components/common/ActionRow/ActionRow.constant';
import type { CalendarLabel } from '@/stores/types';

// TODO: 백엔드(라벨 목록 API) 연동 전까지 사용하는 mock 데이터. 실제 응답으로 교체 필요.
const MOCK_LABELS: CalendarLabel[] = [
  { id: '1', title: '트라이나', color: 'yellow', notificationEnabled: true, source: 'tryna' },
  { id: '2', title: '동아리', color: 'pink', notificationEnabled: true, source: 'tryna' },
  { id: '3', title: 'UMC', color: 'apricot', notificationEnabled: true, source: 'tryna' },
  { id: '4', title: '학교', color: 'purple', notificationEnabled: true, source: 'tryna' },
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
          {MOCK_LABELS.map((label) => (
            <ActionRow
              key={label.id}
              leading={{
                type: 'icon-text',
                text: label.title,
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
