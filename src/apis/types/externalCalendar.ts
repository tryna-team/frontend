/**
 * 외부 캘린더 도메인 타입 (G102 연동 상태·해제, B105 일정 동기화)
 *
 * 연동 자체는 별도 API가 아니라 **소셜 로그인(A105)으로 이뤄진다**. 로그인 시 구글
 * 인가 코드를 넘기면 백엔드가 refresh token까지 확보해 저장하고, 그걸로 구글 캘린더를
 * 읽는다. 재연동도 마찬가지로 A105를 다시 호출하면 된다.
 *
 * 동기화된 외부 일정은 별도 조회 API가 아니라 기존 캘린더 응답(B101/B103)에
 * sourceType: "EXTERNAL_CALENDAR"로 섞여 내려온다.
 */

import type { SocialProvider } from "./auth";

/**
 * 동기화 진행 상태.
 * - NONE: 아직 한 번도 동기화하지 않음
 * - IN_PROGRESS: 서버가 동기화 중 (폴링으로 완료를 기다린다)
 * - SUCCESS / FAILED: 완료
 */
export type ExternalCalendarSyncStatus = "NONE" | "IN_PROGRESS" | "SUCCESS" | "FAILED";

/** G102 외부 캘린더 연동 상태 조회 응답 */
export interface ExternalCalendarConnectionData {
  isConnected: boolean;
  /** 미연동이면 null */
  provider: SocialProvider | null;
  /** 연동된 캘린더 이름. 미연동이면 null */
  calendarName: string | null;
  syncStatus: ExternalCalendarSyncStatus;
  /** ISO 8601 datetime. 한 번도 동기화하지 않았으면 null */
  lastSyncedAt: string | null;
  /** 실패 사유 등 서버가 전달하는 부가 메시지 */
  message: string | null;
}
