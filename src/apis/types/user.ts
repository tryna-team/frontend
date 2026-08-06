/**
 * 유저 도메인 타입 (A101, A102, G103, G104, G105 API 명세서 기준)
 *
 * - 인증 관련 공통 타입(UserRole, AuthTokenResponse, SocialProvider)은 auth.ts에서 재사용한다.
 * - A101만 Authorization 헤더가 선택이고, 나머지(G103/G104/G105)는 전부 인증 필수다.
 */

import type { AuthTokenResponse, SocialProvider, UserRole } from "./auth";

/**
 * A101 앱 진입 (로그인 및 비회원 상태 확인) — GET /api/v1/users/status
 * 토큰이 없거나 만료/무효여도 401이 아니라 200 + userRole "NONE"이 내려온다
 * (앱 진입 자체를 차단하지 않는 정책). 이때 나머지 두 필드는 항상 false다.
 */
export interface UserStatusResponseData {
  userRole: UserRole;
  /** 삭제되지 않은(deleted_at IS NULL) 일정 보유 여부. false면 Empty State 화면(P-A103) */
  hasEvents: boolean;
  /** 상태가 ACTIVE인 외부 캘린더 연동 보유 여부. true면 연동 제안을 중복 노출하지 않는다 */
  hasExternalCalendarConnection: boolean;
}

/**
 * A102 비회원 시작 (임시 사용자 생성) — POST /api/v1/guests
 * guestId는 기기 고유 식별자로, 프론트는 utils/deviceId의 deviceId를 그대로 쓴다
 * (userService.startGuest가 자동으로 채우므로 호출부에서 신경 쓰지 않아도 됨).
 * deviceId가 유지되는 한 같은 기기의 재접속은 기존 비회원 계정으로 이어진다.
 */
export interface GuestStartRequest {
  guestId: string;
  /** 접속 기기 정보, 선택 (예: "iPhone14,2") */
  deviceInfo?: string;
  /** 파이어베이스에서 발급받은 FCM 토큰, 선택 (Redis 활성 토큰 Set에 등록됨) */
  fcmToken?: string;
}

/**
 * A102 응답 data 필드
 * 주의: 신규 생성(201)과 기존 비회원 재접속(200)의 body 구조가 완전히 동일하다.
 * 둘의 구분은 응답 code(A102_GUEST_CREATE_201 / _200)로만 가능한데,
 * client.ts 응답 인터셉터가 data만 언래핑해 넘기므로 서비스 레이어에서는 알 수 없다.
 * 신규 여부가 필요하면 이 API 대신 A101(hasEvents)로 판단할 것.
 */
export interface GuestStartResponseData {
  userId: number;
  /** 항상 "GUEST" */
  userRole: UserRole;
  auth: AuthTokenResponse;
}

/** G103 응답의 linkedAuths 원소 — 비회원(GUEST)은 이 배열이 항상 빈 배열이다 */
export interface LinkedAuth {
  provider: SocialProvider;
  email: string | null;
}

/**
 * G103 계정 정보 확인 — GET /api/v1/users/me
 * linkedAuths가 빈 배열이면 비회원 → 마이페이지에 회원 전환 유도 UI를 렌더링한다.
 */
export interface UserProfileResponseData {
  userId: number;
  userRole: UserRole;
  /** 설정되지 않았으면 null */
  nickname: string | null;
  /** ISO 8601 datetime 문자열 (예: "2026-06-24T10:00:00") */
  createdAt: string;
  linkedAuths: LinkedAuth[];
  hasExternalCalendarConnection: boolean;
}

/**
 * G105 피드백 데이터 사용 설정 — PATCH /api/v1/users/me/recommendation-feedback-setting
 * 요청/응답 필드명이 동일하며, settingsStore.isFeedbackDataCollected와도 이름을 맞춰뒀다.
 */
export interface FeedbackSettingRequest {
  isFeedbackDataCollected: boolean;
}

export type FeedbackSettingResponseData = FeedbackSettingRequest;
