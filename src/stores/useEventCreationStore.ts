// ============================================================
// stores/useEventCreationStore.ts
// 커버: C그룹(자연어 입력~최종 저장) + D그룹(추천) + E그룹(제안 항목 선택/수정/삭제/직접추가/저장)
// ============================================================
//
// 설계 노트: "이벤트 생성 패널"은 입력 → 파싱 → 추천 확인 → 날짜/반복/레이블 선택 → 저장까지
// 여러 화면(2-1~2-12)에 걸친 하나의 위저드(wizard) 플로우다.
// 이런 다단계 폼 상태는 컴포넌트 트리를 넘나들며 유지되어야 하므로 지역 state보다
// 전역 스토어가 적합하지만, 저장(E105) 이후에는 더 이상 필요 없는 "휘발성 상태"이므로
// persist는 사용하지 않는다 (반쯤 쓰다 만 초안이 다음 앱 실행까지 남는 것은 오히려 정책 위반:
// A101 "신규 사용자도 온보딩 없이 캘린더 메인 화면으로 진입"과 충돌).

import { create } from 'zustand';
import type { ParsedEventCandidate, RecommendationCandidate } from './types';

type CreationStep =
  | 'idle'
  | 'input' // 2-1 자연어 입력
  | 'parsing' // C102 1차 파싱 중
  | 'recommendation' // 2-3 자동추천 (D~E 그룹)
  | 'schedule' // 2-4~2-8 날짜/시간/반복 선택
  | 'label'; // 2-9~2-12 레이블 선택/추가

// 2-8 "반복 선택" 화면에서 사용자가 고르는 반복 주기 (없음/매일/매주/매월/매년).
// EventCreationState.recurrence(작성 중인 초안 값)와 setSchedule() 인자에서 쓰인다.
//
// 참고: types.ts의 EventItem.recurrence도 동일한 유니온을 별도로 하드코딩하고 있어
// CalendarProvider처럼 공용 타입으로 합칠 수 있는 지점이다. 다만 이 값은 두 곳뿐이고
// 당장 옵션이 추가될 가능성도 낮아 보여, 지금은 리팩터링하지 않고 가능성만 남겨둔다.
type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface EventCreationState {
  step: CreationStep;
  rawInput: string; // C101 자연어 원문
  parsedCandidate: ParsedEventCandidate | null; // C102 결과

  recommendationCandidates: RecommendationCandidate[]; // D~E 그룹 후보 목록
  isLoadingRecommendations: boolean;

  finalDate: string | null; // 사용자가 조정한 최종 날짜
  finalTime: string | null;
  recurrence: Recurrence;
  labelId: string | null;

  setRawInput: (text: string) => void;
  setStep: (step: CreationStep) => void;
  setParsedCandidate: (candidate: ParsedEventCandidate) => void;
  setLoadingRecommendations: (loading: boolean) => void;
  setRecommendationCandidates: (items: RecommendationCandidate[]) => void;

  toggleCandidateSelected: (candidateId: string) => void; // E101
  editCandidate: (candidateId: string, patch: Partial<RecommendationCandidate>) => void; // E102
  removeCandidate: (candidateId: string) => void; // E103
  addManualCandidate: (item: RecommendationCandidate) => void; // E104

  setSchedule: (patch: Partial<{ date: string; time: string; recurrence: Recurrence }>) => void;
  setLabelId: (labelId: string | null) => void;

  reset: () => void; // E105 저장 완료 또는 사용자 취소 시 초기화
}

const initialState = {
  step: 'idle' as CreationStep,
  rawInput: '',
  parsedCandidate: null as ParsedEventCandidate | null,
  recommendationCandidates: [] as RecommendationCandidate[],
  isLoadingRecommendations: false,
  finalDate: null as string | null,
  finalTime: null as string | null,
  recurrence: 'none' as Recurrence,
  labelId: null as string | null,
};

export const useEventCreationStore = create<EventCreationState>((set) => ({
  ...initialState,

  setRawInput: (text) => set({ rawInput: text }),
  setStep: (step) => set({ step }),

  setParsedCandidate: (candidate) =>
    set({
      parsedCandidate: candidate,
      finalDate: candidate.dateCandidate,
      finalTime: candidate.timeCandidate,
    }),

  setLoadingRecommendations: (loading) => set({ isLoadingRecommendations: loading }),
  setRecommendationCandidates: (items) => set({ recommendationCandidates: items }),

  toggleCandidateSelected: (candidateId) =>
    set((state) => ({
      recommendationCandidates: state.recommendationCandidates.map((c) =>
        c.candidateId === candidateId ? { ...c, selected: !c.selected } : c,
      ),
    })),

  editCandidate: (candidateId, patch) =>
    set((state) => ({
      recommendationCandidates: state.recommendationCandidates.map((c) =>
        c.candidateId === candidateId ? { ...c, ...patch, edited: true } : c,
      ),
    })),

  removeCandidate: (candidateId) =>
    set((state) => ({
      recommendationCandidates: state.recommendationCandidates.filter(
        (c) => c.candidateId !== candidateId,
      ),
    })),

  addManualCandidate: (item) =>
    set((state) => ({
      recommendationCandidates: [...state.recommendationCandidates, item],
    })),

  setSchedule: (patch) =>
    set((state) => ({
      finalDate: patch.date ?? state.finalDate,
      finalTime: patch.time ?? state.finalTime,
      recurrence: patch.recurrence ?? state.recurrence,
    })),

  setLabelId: (labelId) => set({ labelId }),

  reset: () => set(initialState),
}));
