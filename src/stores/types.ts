// ============================================================
// Tryna 전역 상태 공용 타입 (stores/types.ts)
// 정책서(A~G 그룹) + tryna APISpec(Notion)의 필드명을 그대로 따른다.
// ============================================================

import type { LabelType } from '@/apis/types/label';
import type { LabelColor } from '@/components/common/LabelModal/LabelItem';

export type EventSourceType =
  | 'USER_NATURAL_LANGUAGE'
  | 'USER_MANUAL_EDIT'
  | 'EXTERNAL_CALENDAR'
  | 'EXTERNAL_BASED_INTERNAL';

export type EventStatus = 'DRAFT' | 'CONFIRMED' | 'NEEDS_CONFIRMATION' | 'DELETED';

/**
 * G102 "외부 캘린더 연동 설정"에서 실제로 연결할 수 있는 캘린더 서비스 목록.
 *
 * ⚠️ 왜 여기 한 곳에만 정의하는가:
 * 이 값을 useSettingsStore 안에 `'google' | 'apple'`처럼 직접 써버리면,
 * 나중에 Naver 캘린더 등 새 provider를 추가할 때 이 문자열을 참조하는
 * 모든 파일을 일일이 찾아 고쳐야 하고, 하나라도 빠뜨리면 런타임에서만
 * 발견되는 버그가 된다.
 * 대신 이 타입 별칭(alias) 하나만 export해서 store/컴포넌트가 전부
 * 이 타입을 import해 쓰도록 하면, 새 provider 추가는 아래 유니온에
 * 문자열 하나를 더하는 것으로 끝난다. 그 순간 이 타입을 쓰는 모든 곳에서
 * "새로 추가된 값을 처리 안 했다"는 TypeScript 에러가 떠서,
 * 빠뜨린 지점을 컴파일 타임에 바로 찾을 수 있다.
 *
 * 참고: apis/types/auth.ts의 SocialProvider(소셜 로그인 제공자)와 값이 겹치지만
 * 의미가 다른 별개의 개념이라 일부러 통합하지 않았다. 로그인 제공자와 캘린더 연동
 * 제공자는 앞으로 서로 다른 목록으로 발전할 수 있다(예: 카카오 로그인은
 * 추가되어도 카카오 캘린더 연동은 없을 수 있음).
 */
export type CalendarProvider = 'google' | 'apple';

/**
 * B108 라벨_정책서.md + B108-1~5 API 명세서 기준 (라벨 = tryna 일정의 최상위 카테고리).
 * ⚠️ labelId는 명세서상 숫자(Long)이고, color는 실제 API에서 대문자 enum("GREEN" 등)으로
 * 오간다 — apis/types/label.ts의 원본 API 타입(LabelResponseItem)과는 별도로 관리하되,
 * labelType/color는 각각 apis/types/label.ts의 LabelType, LabelModal/LabelItem.tsx의
 * LabelColor(lowercase, 아이콘 매핑용 COLOR_ICON과 함께 정의됨)를 재사용해 느슨한 string보다
 * 타입을 엄격하게 뒀다.
 */
export interface CalendarLabel {
  labelId: number;
  externalCalendarId: number | null; // 외부 캘린더 연동 라벨이면 연결된 외부 캘린더 식별자, 아니면 null
  name: string;
  labelType: LabelType;
  color: LabelColor;
  isDefault: boolean; // 기본 라벨 여부. ⚠️ B108-4상 기본 라벨도 삭제 가능(마지막 1개만 삭제 금지) — "삭제 불가"였던 이전 설명은 부정확했음
  isVisible: boolean; // 캘린더 화면 표시 여부 (숨겨도 일정 데이터는 유지됨)
  sortOrder: number; // 라벨 설정 화면 표시 순서
}

/**
 * B/C 그룹 - 캘린더에 표시되는 일정 (GET /calendars/main, /calendars/dates/{date}/events
 * 등 목록 조회 응답의 EventSummary 스키마 기준).
 * 상세 조회(GET /events/{eventId})에만 있는 description/eventType/externalEventId/provider
 * 등은 여기 포함하지 않는다 — 상세 데이터는 필요해질 때 React Query 등으로 별도 관리.
 *
 * ⚠️ 라벨_정책서.md(B108) 7.1엔 이 일정이 속한 labelId가 언급되지만, swagger엔 아직
 * 라벨 관련 API/필드가 전혀 없다 — 라벨 API가 실제로 나오면 이 타입에 labelId 추가 필요.
 */
export interface EventItem {
  eventId: number;
  title: string;
  startDate: string; // 'YYYY-MM-DD'
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  isAllDay: boolean;
  location?: string | null;
  sourceType: EventSourceType;
  status: EventStatus;
}

/** D104 정책: 일정에 딸린 준비/실행 항목의 유형 (GET .../action-items 응답 Item.itemType 기준) */
export type ActionItemType = 'TIMED_ACTION' | 'UNTIMED_PREP' | 'UNRESOLVED';

/** GET .../action-items, GET .../timed 목록 조회 응답의 Item — 여긴 status 필드가 없음 주의 */
export interface ActionItemEntry {
  title: string;
  itemType: ActionItemType;
  displayDate: string | null;
  displayTime: string | null;
  offsetDays: number;
  createdBy: 'SYSTEM' | 'USER' | 'USER_EDITED';
  sourceTemplateId: string | null;
}

/** PATCH /action-items/{actionItemId}/status 응답 — 목록 조회 Item과 별개 구조 */
export type ActionItemStatus = 'PENDING' | 'COMPLETED' | 'NEEDS_CONFIRMATION' | 'DELETED';

export interface ActionItemStatusUpdate {
  actionItemId: number;
  parentEventId: number;
  actionItemStatus: ActionItemStatus;
  completedAt: string | null;
}

/**
 * D~E 그룹: 서버가 관리하는 "E101~E104 임시 후보"를
 * 사용자가 저장(E105) 전까지 화면에서 선택/수정/삭제하기 위한 클라이언트 측 후보 항목.
 * 확정되면 ActionItem 형태로 변환되어 서버에 저장된다.
 */
export interface RecommendationCandidate {
  candidateId: string;
  title: string;
  // 'CHECKLIST'는 API 값이 아니라, 공용 체크리스트 화면에서 비시간형 항목을 표현하기 위한 클라이언트 전용 값
  itemType: ActionItemType | 'CHECKLIST';
  /** 서버 응답의 원본 항목 유형은 최종 저장 시 사용한다. */
  apiItemType?: 'TIMED_ACTION' | 'UNTIMED_PREP' | 'UNRESOLVED';
  sourceTemplateId?: string | null;
  offsetDays?: number | null;
  originalTitle?: string;
  displayDate?: string | null;
  /** 편집 중인 시간형 항목의 종료 날짜 */
  displayEndDate?: string | null;
  displayTime?: string | null;
  selected: boolean; // E101 제안 항목 선택
  edited: boolean; // E102 제안 항목 수정 여부
}

/** C102 "일정 기본 정보 1차 파싱" 결과 (POST /events/parse 응답 EventParseResponse 기준) */
export interface ParsedEventCandidate {
  sourceText: string;
  titleCandidate: string | null;
  dateCandidate: string | null;
  timeCandidate: string | null;
  placeCandidate: string | null;
  eventTypeCandidate: string | null;
  isAllDayCandidate: boolean;
  needsConfirmation: boolean;
  warnings: { code?: string; message?: string }[];
  // CreateModal.tsx가 EventParseResponse(apis/types/event.ts)를 매핑할 때 그대로 채우는 부가 필드
  tempEventId?: string | null;
  dateSource?: 'EXPLICIT' | 'RELATIVE_EXPRESSION' | 'SELECTED_DATE' | 'DEFAULT_TODAY' | null;
  endDateCandidate?: string | null;
  endTimeCandidate?: string | null;
  embeddingWords?: string[];
}
