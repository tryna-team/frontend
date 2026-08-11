import type { EventParseResponse } from '@/apis/types/event';
import type { RecommendationResponse, RecommendationSuggestion } from '@/apis/types/recommendation';
import type { ParsedEventCandidate, RecommendationCandidate } from '@/stores/types';

export const mapParseResponse = (
  input: string,
  response: EventParseResponse,
  tempEventId: string | null,
): ParsedEventCandidate => ({
  sourceText: input,
  titleCandidate: response.eventTitle ?? input,
  dateCandidate: response.startDate ?? null,
  timeCandidate: response.startTime ?? null,
  placeCandidate: response.placeCandidate ?? null,
  eventTypeCandidate: null,
  tempEventId,
  dateSource: response.dateSource ?? null,
  endDateCandidate: response.endDate ?? null,
  endTimeCandidate: response.endTime ?? null,
  embeddingWords: response.toEmbedding ?? [],
  isAllDayCandidate: response.isAllDayCandidate ?? false,
  needsConfirmation: response.needsConfirmation ?? false,
  warnings: response.warnings ?? [],
});

export const createParseFallback = (
  input: string,
  tempEventId: string | null,
): ParsedEventCandidate => ({
  sourceText: input,
  titleCandidate: input,
  dateCandidate: null,
  timeCandidate: null,
  placeCandidate: null,
  eventTypeCandidate: null,
  tempEventId,
  dateSource: null,
  endDateCandidate: null,
  endTimeCandidate: null,
  embeddingWords: [],
  isAllDayCandidate: true,
  needsConfirmation: true,
  warnings: [],
});

export const mapRecommendationCandidate = (
  suggestion: RecommendationSuggestion,
  index: number,
): RecommendationCandidate => ({
  candidateId: suggestion.sourceCode ?? `recommendation-${index}`,
  title: suggestion.displayText ?? suggestion.sourceCode ?? '',
  itemType: suggestion.itemType === 'TIMED_ACTION' ? 'TIMED_ACTION' : 'CHECKLIST',
  apiItemType: suggestion.itemType ?? 'UNRESOLVED',
  sourceTemplateId: suggestion.sourceCode ?? null,
  offsetDays: suggestion.offsetDays ?? null,
  originalTitle: suggestion.displayText ?? suggestion.sourceCode ?? '',
  displayDate: suggestion.displayDate ?? null,
  displayTime: null,
  selected: true,
  edited: false,
});

export const hasRecommendationFailed = (response: RecommendationResponse) =>
  response.suggestionStatus === 'ERROR' || response.suggestionStatus === 'EMPTY';
