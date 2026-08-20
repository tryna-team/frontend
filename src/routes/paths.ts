export const PATH = {
  SPLASH: '/',
  ABOUT: '/about',
  HOME: '/home',
  DAILY: '/daily/:date',
  EVENT_VIEW: '/event/:eventId',
  YEAR_CALENDAR: '/calendar/year', // 연간 캘린더
  TERMS: '/terms',
  PRIVACY: '/privacy',
  GOOGLE_CALENDAR_POLICY: '/google-calendar-policy',
} as const;

export const PUBLIC_PATHS = [
  PATH.ABOUT,
  PATH.TERMS,
  PATH.PRIVACY,
  PATH.GOOGLE_CALENDAR_POLICY,
] as const;

export const generateDailyPath = (date: string) => `/daily/${date}`;

export const generateEventPath = {
  view: (id: string, occurrenceDate?: string) =>
    occurrenceDate
      ? `/event/${id}?occurrenceDate=${encodeURIComponent(occurrenceDate)}`
      : `/event/${id}`,
} as const;
