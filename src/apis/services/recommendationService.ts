import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  RecommendationRequest,
  RecommendationResponse,
} from "../types/recommendation";

export const recommendationService = {
  /** D101~D105 일정 정보를 바탕으로 준비·실행 항목을 추천한다. */
  getRecommendations: (
    request: RecommendationRequest,
    signal?: AbortSignal,
  ) =>
    apiClient.post<RecommendationResponse>(
      ENDPOINTS.RECOMMENDATIONS.ROOT,
      request,
      { signal },
    ),
};

