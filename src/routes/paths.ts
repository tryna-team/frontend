export const PATH = {
  SPLASH: '/',
  HOME: '/home',
  DAILY: '/daily/:date',
  EVENT_VIEW: '/event/:eventId',
  YEAR_CALENDAR: '/calendar/year', //연간 캘린더 
} as const;

export const generateDailyPath = (
  date: string,
) => `/daily/${date}`;

export const generateEventPath = {
  view: (id: string) =>
    `/event/${id}`,
} as const;
