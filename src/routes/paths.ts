export const PATH = {
  SPLASH: '/',
  HOME: '/home',
  DAILY: '/daily/:date',
  EVENT_VIEW: '/event/:eventId',
} as const;

export const generateDailyPath = (
  date: string,
) => `/daily/${date}`;

export const generateEventPath = {
  view: (id: string) =>
    `/event/${id}`,
} as const;
