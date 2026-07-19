import { Fragment } from 'react';

import ChecklistItem from './ChecklistItem';

import type {
  ChecklistIconSize,
  ChecklistRadioVariant,
  ChecklistStatus,
  ChecklistTrailing,
} from './ChecklistItem';

//Checklist에 전달되는 단일 항목 데이터
export type ChecklistItemData = {
  id: number;
  label: string;
  //항목의 체크 및 추가 상태
  status?: ChecklistStatus;
  iconSize?: ChecklistIconSize;
  trailing?: ChecklistTrailing;
  disabled?: boolean;
};

export type ChecklistProps = {
  //화면에 표시할 Checklist 항목 목록
  items: ChecklistItemData[];
  iconSize?: ChecklistIconSize;
  //Checklist가 사용되는 화면 유형
  radioVariant?: ChecklistRadioVariant;
  //왼쪽 아이콘 클릭 시 항목 ID와 함께 실행되는 함수
  onLeadingClick?: (id: number) => void;
};

//화면 유형별 기본 라디오 아이콘 크기
//create, event: medium
//daily: small
const RADIO_ICON_SIZE: Record<
  ChecklistRadioVariant,
  ChecklistIconSize
> = {
  create: 'medium',
  event: 'medium',
  daily: 'small',
};

//화면 유형별 Checklist 전체 너비
//create, event: 353px
//daily: 299px
const CHECKLIST_LAYOUT: Record<
  ChecklistRadioVariant,
  string
> = {
  create: 'w-[353px]',
  event: 'w-[353px]',
  daily: 'w-[299px]',
};

//화면 유형별 단일 행 외부 레이아웃
//create:
//divider를 제외한 행 높이 45px
//상하 패딩 12px
//실제 ChecklistItem 콘텐츠 높이 21px

//event:
//상하 패딩 4px

//daily:
//별도 패딩 없이 ChecklistItem 크기 사용
const ITEM_LAYOUT: Record<
  ChecklistRadioVariant,
  string
> = {
  create:
    'flex h-[45px] w-full items-center py-3',
  event:
    'flex w-full items-center py-1',
  daily:
    'flex w-full items-center',
};

//항목 상태와 화면 유형을 기준으로 실제 사용할 아이콘 크기 결정
function resolveChecklistIconSize(
  status: ChecklistStatus,
  iconSize: ChecklistIconSize,
  radioVariant: ChecklistRadioVariant,
): ChecklistIconSize {
  //plus: 항상 small
  if (status === 'plus') {
    return 'small';
  }

  //기본 체크 항목: 화면 유형별 기본 크기 사용
  if (
    status === 'default' ||
    status === 'done'
  ) {
    return RADIO_ICON_SIZE[radioVariant];
  }

  //add: 항목 또는 Checklist에서 전달한 크기 사용
  return iconSize;
}

//Checklist 목록 컴포넌트

//items 순회 및 ChecklistItem 렌더링
//화면 유형별 전체 너비와 행 패딩 설정
//create 화면 divider 렌더링
//아이콘 크기 결정
//항목별 클릭 및 삭제 이벤트 연결
export default function Checklist({
  items,
  iconSize = 'medium',
  radioVariant = 'event',
  onLeadingClick,
}: ChecklistProps) {
  return (
    <div
      className={`flex flex-col ${CHECKLIST_LAYOUT[radioVariant]}`}
    >
      {items.map((item) => {
        //status가 전달X ->  기본 체크 상태를 사용
        const status =
          item.status ?? 'default';

        //개별 항목의 iconSize 우선 사용 -> X: Checklist에 전달된 기본 iconSize를 사용
        const requestedIconSize =
          item.iconSize ?? iconSize;

        const resolvedIconSize =
          resolveChecklistIconSize(
            status,
            requestedIconSize,
            radioVariant,
          );

        const trailing: ChecklistTrailing =
          item.trailing ?? {
            type: 'none',
          };

        return (
          <Fragment key={item.id}>
            {/* create: 각 행 위에 높이 1px의 divider 추가 */}
            {radioVariant ===
              'create' && (
              <div
                className="h-px w-full shrink-0 bg-divider-default"
                aria-hidden="true"
              />
            )}

            {/* 화면 유형별 너비, 높이, 패딩을 담당하는 행 wrapper */}
            <div
              className={
                ITEM_LAYOUT[
                  radioVariant
                ]
              }
            >
              <ChecklistItem
                label={item.label}
                status={status}
                iconSize={
                  resolvedIconSize
                }
                radioVariant={
                  radioVariant
                }
                trailing={trailing}
                disabled={
                  item.disabled
                }
                onLeadingClick={() =>
                  onLeadingClick?.(
                    item.id,
                  )
                }
              />
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}