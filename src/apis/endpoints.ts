/**
 * 도메인별 엔드포인트 상수 (tryna APISpec 기준)
 * baseURL(/api/v1)은 apis/client.ts에서 관리하므로 여기는 그 이후 path만 정의
 *
 * 동적 path parameter는 encodeURIComponent로 인코딩한다 — id/문자열에 특수문자가
 * 섞여도 URL이 깨지지 않도록 하기 위함.
 */
export const ENDPOINTS = {
  AUTH: {
    // A104 로그인 필요 안내 (계정 권한 요구사항 검증) - Query: actionType
    PERMISSIONS: "/auth-sessions/permissions",
    // A105 소셜 회원가입 및 로그인
    SESSIONS: "/auth-sessions",
    // A108 토큰 갱신 (Token Refresh)
    REFRESH: "/auth-sessions/refresh",
    // A109 로그아웃 - Query: deviceId
    LOGOUT: "/auth-sessions/me",
  },
  USERS: {
    // A101 앱 진입 (로그인 및 비회원 상태 확인)
    STATUS: "/users/status",
    // A102 비회원 시작 (임시 사용자 생성)
    GUESTS: "/guests",
    // A106 회원 전환 유도 (비회원 데이터를 정식 계정으로 전환)
    CONVERSIONS: "/users/conversions",
    // G103 계정 정보 확인 / G104 데이터 삭제 (회원 탈퇴, Soft Delete)
    ME: "/users/me",
    // 추천 피드백 데이터 사용 설정
    RECOMMENDATION_FEEDBACK_SETTING: "/users/me/recommendation-feedback-setting",
  },
  CALENDAR: {
    // 캘린더 메인 화면 조회 - Query: year, month, selectedDate
    MAIN: "/calendars/main",
    // 월간 캘린더 조회 - Query: year, month
    MONTHLY: "/calendars/monthly",
    // 날짜별 일정 목록 조회
    DATE_EVENTS: (date: string) =>
      `/calendars/dates/${encodeURIComponent(date)}/events`,
    // 외부 캘린더 연동
    EXTERNAL_CONNECTIONS: "/calendars/external/connections",
    // 사용자 외부 캘린더 목록 등록(POST) / 조회(GET)
    EXTERNAL_USER_LIST: "/calendars/external/user-list",
    // 사용자 외부 캘린더 가져오기 on/off
    EXTERNAL_TOGGLE: (externalCalendarId: number | string) =>
      `/calendars/external/${encodeURIComponent(externalCalendarId)}`,
    // 일자별 외부 캘린더 일정 목록 조회
    EXTERNAL_EVENTS: "/calendars/external/events",
    // 외부 캘린더 일정 등록 - Query: year, month, date
    EXTERNAL_EVENT_CREATE: "/calendars/external/event",
  },
  EVENTS: {
    ROOT: "/events",
    DETAIL: (eventId: number | string) =>
      `/events/${encodeURIComponent(eventId)}`,
    // 자연어 일정 입력 및 1차 파싱
    PARSE: "/events/parse",
    // 키워드 검색 - Query: keyword
    SEARCH: "/events/search",
  },
  ACTION_ITEMS: {
    // 준비/실행 항목 저장(POST) / 일정 연결 항목 조회(GET)
    BY_EVENT: (eventId: number | string) =>
      `/events/${encodeURIComponent(eventId)}/action-items`,
    // 준비/실행 항목 완료 처리
    STATUS: (actionItemId: number | string) =>
      `/action-items/${encodeURIComponent(actionItemId)}/status`,
    // 캘린더 내 시간형 실행 항목 조회 - Query: date
    CALENDAR_TIMED: "/calendar/action-items/timed",
  },
  LABELS: {
    // B108-1 라벨 목록 조회(GET) / B108-2 라벨 생성(POST)
    ROOT: "/labels",
    // B108-3 라벨 수정(PATCH) / B108-4 라벨 삭제(DELETE)
    DETAIL: (labelId: number | string) =>
      `/labels/${encodeURIComponent(labelId)}`,
    // B108-5 라벨 순서 변경(PATCH)
    ORDER: "/labels/order",
  },
  RECOMMENDATIONS: {
    // 일정 기반 준비/실행 항목 추천
    ROOT: "/recommendations",
  },
  ALARMS: {
    PUSH_TOKEN: "/alarms/push-token", // POST 등록 / DELETE 삭제(Query: fcmPushToken)
    REMIND_EVENT: (userEventId: number | string) =>
      `/alarms/remind/event/${encodeURIComponent(userEventId)}`,
    REMIND_ACTION_ITEM: (actionItemId: number | string) =>
      `/alarms/remind/action-item/${encodeURIComponent(actionItemId)}`,
    // 알람 목록 조회 - Query: size, cursor
    LIST: "/alarms-list",
  },
} as const;