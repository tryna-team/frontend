export const applyLink = import.meta.env.VITE_APPLY_LINK || "#recruiting"

export const linkProps =
  applyLink.startsWith("http://") || applyLink.startsWith("https://")
    ? { target: "_blank", rel: "noreferrer" }
    : {}

export const externalApplyLink = import.meta.env.VITE_APPLY_LINK || ""

export const externalApplyLinkProps =
  externalApplyLink.startsWith("http://") ||
  externalApplyLink.startsWith("https://")
    ? { target: "_blank", rel: "noreferrer" }
    : {}

export const navItems = [
  { label: "서비스 소개", path: "/service" },
  { label: "팀문화", path: "/culture" },
  { label: "지원", path: "/apply" },
  { label: "멤버소개", path: "/members" },
]

export const lifestyleCards = [
  {
    label: "수업 있는 날",
    title: "수업 전 챙김",
    src: "/assets/landing/lifestyle-01.png",
    alt: "수업 또는 강의가 있는 날의 일상 이미지",
  },
  {
    label: "팀플 전",
    title: "회의 준비",
    src: "/assets/landing/lifestyle-02.png",
    alt: "팀 프로젝트 회의를 준비하는 일상 이미지",
  },
  {
    label: "발표 전날",
    title: "자료 점검",
    src: "/assets/landing/lifestyle-03.png",
    alt: "발표 전날 필요한 것을 정리하는 이미지",
  },
  {
    label: "병원 가기 전",
    title: "예약 확인",
    src: "/assets/landing/lifestyle-04.png",
    alt: "병원 또는 약속 이동 전의 일상 이미지",
  },
  {
    label: "운동 가는 저녁",
    title: "가방 챙기기",
    src: "/assets/landing/lifestyle-05.png",
    alt: "운동을 가기 전 준비물을 챙기는 이미지",
  },
  {
    label: "떠나기 전",
    title: "이동 준비",
    src: "/assets/landing/lifestyle-06.png",
    alt: "여행이나 이동 전 준비하는 일상 이미지",
  },
  {
    label: "시험 전",
    title: "준비 확인",
    src: "/assets/landing/lifestyle-07.png",
    alt: "시험이나 중요한 일정 전 준비를 확인하는 일상 이미지",
  },
]

export const productPreviewImages = [
  {
    src: "/assets/landing/7.png",
    alt: "tryna 월간 캘린더 화면",
  },
  {
    src: "/assets/landing/4.png",
    alt: "tryna 일정과 할 일을 함께 보는 주간 화면",
  },
  {
    src: "/assets/landing/6.png",
    alt: "tryna 일정 카드와 할 일 확인 화면",
  },
  {
    src: "/assets/landing/2.png",
    alt: "tryna 일정 입력과 챙길 일 추가 화면",
  },
]

export const problemCards = [
  {
    title: "캘린더에는 시간만 남음",
    body: "일정은 저장되지만, 그 전에 챙겨야 할 일은 따로 정리되지 않을 때가 많습니다.",
  },
  {
    title: "메모와 할 일이 흩어짐",
    body: "준비물은 메모에, 급한 내용은 카카오톡에, 할 일은 다른 앱에 남아 다시 찾아야 합니다.",
  },
  {
    title: "오늘 필요한 것만 보기 어려움",
    body: "여러 곳에 흩어진 내용을 오가다 보면 정작 오늘 필요한 것만 빠르게 보기 어렵습니다.",
  },
]

export const serviceBlocks = [
  {
    title: "가볍게 적는 일정",
    body: "복잡한 입력 폼보다 가볍게 적고, 할 일을 확인해요",
    src: "/assets/landing/service-input.png",
    alt: "가볍게 적는 일정 이미지",
    accent: "bg-[#EFFFF7]",
  },
  {
    title: "일정과 함께 할 일 보기",
    body: "할 일과 준비물을 따로 흩어두지 않고, 어떤 일정과 연결된 일인지 함께 보여줘요",
    src: "/assets/landing/service-task.png",
    alt: "일정 옆에 연결되는 챙길 일 이미지",
    accent: "bg-[#F7F8F7]",
  },
  {
    title: "오늘의 일정과 할 일 한 화면에서 보기",
    body: "오늘의 일정와 할 일들을 한 화면에서 가볍게 확인해요",
    src: "/assets/landing/service-today.png",
    alt: "오늘 한 화면 서비스 방향 이미지",
    accent: "bg-[#F3FAF6]",
  },
]
