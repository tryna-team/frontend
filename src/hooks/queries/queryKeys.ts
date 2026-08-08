/**
 * TanStack Query key factory (tryna APISpec 기준)
 * 계층 구조를 둬서 invalidateQueries 범위를 세밀하게 제어한다.
 * 예: queryKeys.events.all → 이벤트 전체 무효화
 *     queryKeys.calendars.main(2026, 7, "2026-07-01") → 특정 월만 무효화
 */
export const queryKeys = {
  users: {
    all: ["users"] as const,
    status: () => [...queryKeys.users.all, "status"] as const, // A101
    me: () => [...queryKeys.users.all, "me"] as const, // G103
  },

  calendars: {
    all: ["calendars"] as const,
    main: (year: number, month: number, selectedDate?: string) =>
      [...queryKeys.calendars.all, "main", year, month, selectedDate] as const,
    dateEvents: (date: string) =>
      [...queryKeys.calendars.all, "dates", date, "events"] as const,
    externalUserList: () =>
      [...queryKeys.calendars.all, "external", "user-list"] as const,
    externalEvents: () =>
      [...queryKeys.calendars.all, "external", "events"] as const,
  },

  events: {
    all: ["events"] as const,
    detail: (eventId: number | string) =>
      [...queryKeys.events.all, "detail", eventId] as const,
    search: (keyword: string) =>
      [...queryKeys.events.all, "search", keyword] as const,
  },

  actionItems: {
    all: ["action-items"] as const,
    byEvent: (eventId: number | string) =>
      [...queryKeys.actionItems.all, "event", eventId] as const,
    calendarTimed: (date: string) =>
      [...queryKeys.actionItems.all, "calendar-timed", date] as const,
  },

  labels: {
    all: ["labels"] as const,
    list: () => [...queryKeys.labels.all, "list"] as const, // B108-1
  },

  recommendations: {
    all: ["recommendations"] as const,
  },

  alarms: {
    all: ["alarms"] as const,
    list: (size?: number, cursor?: string) =>
      [...queryKeys.alarms.all, "list", size, cursor] as const,
  },
} as const;