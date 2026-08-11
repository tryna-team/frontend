import type { EventRecurrenceType } from '@/apis/types/event';
import type { RepeatOption } from '@/features/event/components/create';

import type { LabelColor } from './CreateModal.types';

export const COLOR_ICON: Record<LabelColor, string> = {
  apricot: '/icon/color_picker/apricot_small.svg',
  blue: '/icon/color_picker/blue_small.svg',
  green: '/icon/color_picker/green_small.svg',
  pink: '/icon/color_picker/pink_small.svg',
  purple: '/icon/color_picker/purple_small.svg',
  yellow: '/icon/color_picker/yellow_small.svg',
};

export const ADD_CHECKLIST_ITEM_ID = -1;

export const PARSING_THROTTLE_DELAY = 300;
export const RECOMMENDATION_DEBOUNCE_DELAY = 1000;

export const RECURRENCE_TYPE: Record<RepeatOption, EventRecurrenceType> = {
  매일: 'DAILY',
  매주: 'WEEKLY',
  매월: 'MONTHLY',
  매년: 'YEARLY',
};

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');
