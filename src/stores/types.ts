// ============================================================
// Tryna 전역 상태 공용 타입 (stores/types.ts)
// 정책서(A~G 그룹) + tryna APISpec(Notion)의 필드명을 그대로 따른다.
// ============================================================

export type EventSource = 'internal' | 'external'; // tryna 자체 생성 / 외부 캘린더 연동

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
 * 참고: TrynaUser.provider(소셜 로그인 제공자)와 값이 겹치지만 의미가 다른
 * 별개의 개념이라 일부러 통합하지 않았다. 로그인 제공자와 캘린더 연동
 * 제공자는 앞으로 서로 다른 목록으로 발전할 수 있다(예: 카카오 로그인은
 * 추가되어도 카카오 캘린더 연동은 없을 수 있음).
 */
export type CalendarProvider = 'google' | 'apple';

/** 레이블 = 캘린더 그룹 (Gmail 계정, tryna 그룹, 커스텀 그룹 등) */
export interface CalendarLabel {
  id: string;
  title: string;
  color: string; // 6가지 프리셋 색상 중 하나
  notificationEnabled: boolean;
  source: 'gmail' | 'tryna' | 'external';
}

/** B/C 그룹 - 캘린더에 표시되는 일정 (events 테이블) */
export interface EventItem {
  eventId: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  time?: string | null; // 'HH:mm', 없으면 종일/시간 미정
  place?: string | null;
  sourceText: string; // 자연어 원문 (C102 파싱 원본)
  source: EventSource;
  labelId?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt?: string;
}

/** D104 정책: 일정에 딸린 준비/실행 항목의 두 가지 유형 */
export type ActionItemType = 'TIMED_ACTION' | 'CHECKLIST'; // 시간형 실행 항목 / 비시간형 준비 항목
export type ActionItemStatus = 'pending' | 'done';

/** E105 저장 데이터 예시(actionItemId, parentEventId, itemType, displayDate, status)를 그대로 반영 */
export interface ActionItem {
  actionItemId: string;
  parentEventId: string;
  title: string;
  itemType: ActionItemType;
  displayDate?: string | null; // TIMED_ACTION일 때만 사용 (D-day 등 실행 날짜)
  status: ActionItemStatus;
}

/**
 * D~E 그룹: 서버가 관리하는 "E101~E104 임시 후보"를
 * 사용자가 저장(E105) 전까지 화면에서 선택/수정/삭제하기 위한 클라이언트 측 후보 항목.
 * 확정되면 ActionItem 형태로 변환되어 서버에 저장된다.
 */
export interface RecommendationCandidate {
  candidateId: string;
  title: string;
  itemType: ActionItemType;
  displayDate?: string | null;
  selected: boolean; // E101 제안 항목 선택
  edited: boolean; // E102 제안 항목 수정 여부
}

/** C102 "일정 기본 정보 1차 파싱" 결과 예시와 동일한 필드 구성 */
export interface ParsedEventCandidate {
  sourceText: string;
  titleCandidate: string | null;
  dateCandidate: string | null;
  timeCandidate: string | null;
  placeCandidate: string | null;
  eventTypeCandidate: string | null;
}

export type AuthStatus = 'unauthenticated' | 'guest' | 'member';

export interface TrynaUser {
  id: string;
  email: string;
  //이거 대문자임 provider,
  provider: 'google' | 'apple' | null;
}
