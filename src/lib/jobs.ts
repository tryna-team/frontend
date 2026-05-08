export const jobPosts = [
  {
    id: "product-designer",
    title: "Product Designer",
    description:
      "사용자의 작은 불편과 놓침을 줄이는 제품 경험을 만듭니다.",
    detail: {
      introBullets: [
        "일상 속 일정과 챙길 일이 자연스럽게 이어지는 경험을 함께 만듭니다.",
        "사용자가 놓치기 쉬운 순간을 발견하고 더 가벼운 흐름으로 정리합니다.",
        "작은 불편을 줄이는 제품 방향에 공감한다면 지원해 주세요.",
      ],
      sections: [
        {
          title: "Product Designer는 이렇게 만들어 나가요",
          items: [
            "홈, 일정 생성, 일정 편집 등 핵심 화면 UX를 직접 설계하며 실제 서비스의 사용자 경험을 만들어볼 수 있어요",
            "일정 생성 → 제안 → 실행으로 이어지는 전체 사용자 흐름과 인터랙션 구조를 설계하는 경험을 할 수 있어요",
            "개발자와 협업하며 구현 가능한 UI, 디자인 시스템, 컴포넌트를 함께 설계하는 경험을 할 수 있어요",          
          ],
        },
      ],
    },
    applyLink:
      "https://docs.google.com/forms/d/e/1FAIpQLSed0Xtuhrn9-xI7WlIgDqE9HCk-XiUEQgILYM9mb_npdERU5Q/viewform?usp=dialog",
  },
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    description:
      "일정과 챙길 일이 자연스럽게 이어지는 웹 제품 경험을 구현합니다.",
    detail: {
      introBullets: [
        "React 기반으로 사용자가 매일 마주하는 핵심 화면을 구현합니다.",
        "가벼운 입력, 빠른 확인, 자연스러운 전환을 제품 안에서 구체화합니다.",
        "디자인과 실제 구현 사이의 간극을 줄이며 MVP를 빠르게 검증합니다.",
      ],
      sections: [
        {
          title: "Frontend Developer는 이렇게 만들어 나가요",
          items: [
            "Vite, React, TypeScript 기반으로 tryna의 핵심 화면과 라우팅을 구현합니다.",
            "일정 생성, 오늘 화면, 챙길 일 흐름 등 사용자가 직접 만지는 인터랙션을 만듭니다.",
            "디자이너와 함께 컴포넌트 단위의 UI 품질과 반응형 경험을 다듬습니다.",
            "작은 기능을 빠르게 배포하고 사용자 피드백을 반영할 수 있는 구조를 고민합니다.",
          ],
        },
      ],
    },
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    description:
      "일정, 할 일, 준비물이 안정적으로 연결되는 제품 기반을 설계합니다.",
    detail: {
      introBullets: [
        "사용자의 일정 데이터와 챙길 일을 안정적으로 저장하고 연결합니다.",
        "가벼운 제품 경험 뒤에서 필요한 데이터 구조와 API를 설계합니다.",
        "초기 MVP가 빠르게 검증될 수 있도록 단순하지만 확장 가능한 기반을 만듭니다.",
      ],
      sections: [
        {
          title: "Backend Developer는 이렇게 만들어 나가요",
          items: [
            "일정, 할 일, 준비물, 사용자 데이터를 다루는 API와 데이터 모델을 설계합니다.",
            "프론트엔드와 협업하며 실제 화면 흐름에 맞는 응답 구조를 함께 정리합니다.",
            "인증, 저장, 조회, 알림 등 제품 성장에 필요한 기반을 단계적으로 구축합니다.",
            "초기 서비스의 운영 안정성과 개발 속도 사이의 균형을 고민합니다.",
          ],
        },
      ],
    },
  },
]

export function getJobPost(jobId: string | undefined) {
  return jobPosts.find((job) => job.id === jobId)
}
