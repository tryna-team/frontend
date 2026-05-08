# tryna 랜딩페이지 구현 명세서 v2

## 1. 목적

tryna 랜딩페이지는 아직 완성된 서비스를 판매하는 페이지가 아니라, 서비스 방향을 소개하고 함께 만들 동료를 모집하는 페이지다.

구조는 첨부 레퍼런스의 흐름을 참고한다.

- 상단 내비게이션
- 큰 비전 카피
- 가로 이미지 카드 영역
- 문제 상황 소개
- 서비스 구성 설명
- 동료 모집 CTA 배너
- 푸터

단, 내용과 톤은 tryna에 맞게 조정한다.

---

## 2. 구현 스택

```text
Vite
React
TypeScript
Tailwind CSS
shadcn/ui
Motion for React
lucide-react
Vercel 또는 Netlify 정적 배포
```

설치 예시:

```bash
npm create vite@latest tryna-landing -- --template react-ts
cd tryna-landing
npm install
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
npx shadcn@latest init
npx shadcn@latest add button card badge separator sheet
npm install motion lucide-react
```

---

## 3. 브랜드 표기

브랜드명은 항상 소문자 `tryna`로 표기한다.

사용 금지:

```text
Tryna
TRYNA
트라이나
```

---

## 4. 페이지 섹션 구조

```text
1. Header
2. Hero
3. Lifestyle Image Rail
4. Problem Context
5. Service Direction
6. Product Preview
7. Recruiting CTA Banner
8. Footer
```

---

## 5. Header

### 구성

좌측:

```text
tryna
```

우측 메뉴:

```text
서비스 소개
만드는 방향
함께하기
```

우측 CTA:

```text
지원하기
```

### 동작

- sticky header
- 스크롤 시 흰색 반투명 배경과 blur 적용
- 모바일에서는 메뉴 숨김, CTA만 유지하거나 Sheet 메뉴 사용

---

## 6. Hero

### 레이아웃

- 중앙 또는 좌측 정렬 텍스트 블록
- 넓은 여백 사용
- 하단에 이미지 카드 레일이 이어지도록 구성

### 메인 카피

```text
캘린더에 적은 일정이,
하루의 흐름으로 이어지도록.
```

### 서브 카피

```text
tryna는 일정과 함께 챙길 일, 준비물을 한곳에 가볍게 정리하는 일상 캘린더를 만들고 있습니다.
```

### CTA

Primary:

```text
지원하기
```

Secondary:

```text
만드는 방향 보기
```

### 보조 라벨

```text
일정과 챙길 일을 한 흐름으로
```

---

## 7. Lifestyle Image Rail

### 목적

텍스트만 있는 랜딩을 피하고, tryna가 들어갈 일상 맥락을 보여준다.

### 레이아웃

- Hero 아래 가로 스크롤 이미지 카드 영역
- 데스크톱에서는 5개에서 6개 카드 노출
- 모바일에서는 좌우 스와이프
- 각 카드 위에 작은 라벨 칩 배치

### 카드 예시

| 이미지               | 라벨       |
| ----------------- | -------- |
| 수업 또는 강의 장면       | 수업 있는 날  |
| 팀플 회의 장면          | 팀플 전     |
| 발표 준비 장면          | 발표 전날    |
| 병원 또는 약속 이동 장면    | 병원 가기 전  |
| 운동 가방 또는 저녁 루틴 장면 | 운동 가는 저녁 |
| 여행 짐 또는 이동 장면     | 떠나기 전    |

### 파일 경로

```text
/public/assets/landing/lifestyle-01.png
/public/assets/landing/lifestyle-02.png
/public/assets/landing/lifestyle-03.png
/public/assets/landing/lifestyle-04.png
/public/assets/landing/lifestyle-05.png
/public/assets/landing/lifestyle-06.png
```

이미지가 없으면 단색 배경의 placeholder 카드를 표시한다.

---

## 8. Problem Context

### 목적

첨부 레퍼런스의 중간 정보 섹션을 그대로 따라가지 않는다. tryna는 아직 연혁을 보여줄 단계가 아니므로, 이 구간에서는 서비스가 바라보는 문제 상황을 더 구체적으로 보여준다.

### 레이아웃

- 좌측: 문제를 설명하는 큰 문장
- 우측: 일정, 메모, 할 일, 준비물이 흩어진 상황을 보여주는 카드 그래픽
- 배경은 옅은 회색 또는 아이보리 계열

### 섹션 제목

```text
일정은 캘린더에 있는데,
챙길 일은 자주 흩어집니다.
```

### 설명 문구

```text
수업, 팀플, 병원, 약속처럼 일정은 캘린더에 적어두지만 그 일정에 필요한 할 일이나 준비물은 메모, 카카오톡, 머릿속에 따로 남는 경우가 많습니다.
```

### 문제 카드

#### 카드 1

제목:

```text
캘린더에는 시간만 남음
```

본문:

```text
일정은 저장되지만, 그 전에 챙겨야 할 일은 따로 정리되지 않을 때가 많습니다.
```

#### 카드 2

제목:

```text
메모와 할 일이 흩어짐
```

본문:

```text
준비물은 메모에, 급한 내용은 카카오톡에, 할 일은 다른 앱에 남아 다시 찾아야 합니다.
```

#### 카드 3

제목:

```text
오늘 필요한 것만 보기 어려움
```

본문:

```text
여러 곳에 흩어진 내용을 오가다 보면 정작 오늘 필요한 것만 빠르게 보기 어렵습니다.
```

### 이미지 또는 그래픽

선택 이미지:

```text
/public/assets/landing/problem-context.png
```

이미지가 없으면 shadcn Card 기반 그래픽으로 대체한다.

---

## 9. Service Direction

### 목적

첨부 레퍼런스의 서비스 구성 설명 섹션처럼, tryna가 어떤 경험 요소로 구성되는지 설명한다.

### 섹션 제목

```text
tryna는 일정, 할 일, 준비물을 한 흐름으로 연결하는 일상 캘린더를 지향합니다.
```

### 구성

4개의 설명 블록을 세로로 배치한다. 각 블록은 이미지 또는 카드 그래픽 1개와 텍스트 1개로 구성한다.

---

### 블록 1

제목:

```text
가볍게 적는 일정
```

본문:

```text
복잡한 입력 폼보다 먼저 일정을 가볍게 적고, 필요한 정보만 확인합니다.
```

이미지:

```text
/public/assets/landing/service-input.png
```

---

### 블록 2

제목:

```text
일정 옆에 붙는 챙길 일
```

본문:

```text
할 일과 준비물을 따로 흩어두지 않고, 어떤 일정과 연결된 일인지 함께 보여줍니다.
```

이미지:

```text
/public/assets/landing/service-task.png
```

---

### 블록 3

제목:

```text
오늘 한 화면
```

본문:

```text
오늘의 일정, 할 일, 준비물을 한 화면에서 가볍게 확인할 수 있게 합니다.
```

이미지:

```text
/public/assets/landing/service-today.png
```

---

### 블록 4

제목:

```text
함께 다듬는 제품
```

본문:

```text
아직 정답을 확정하지 않고, 실제 사용 흐름을 보며 제품의 방향을 다듬고 있습니다.
```

이미지:

```text
/public/assets/landing/service-team.png
```

이미지가 없으면 shadcn Card 기반 placeholder를 사용한다.

---

## 10. Product Preview

### 목적

직접 제작한 와이어프레임 이미지를 보여준다. Codex가 앱 UI를 임의로 디자인하지 않는다.

### 섹션 제목

```text
지금 만들고 있는 화면
```

### 설명

```text
tryna는 홈에서 오늘의 일정과 그 일정에 연결된 할 일, 준비물을 함께 확인하는 방향으로 설계하고 있습니다.
```

### 이미지

```text
/public/assets/landing/hero-wireframe-mockup.png
```

이미지가 없으면 아래 placeholder를 표시한다.

```text
와이어프레임 이미지 준비 중
직접 제작한 화면 시안이 들어갈 예정입니다.
```

---

## 11. Recruiting CTA Banner

### 목적

첨부 레퍼런스의 하단 CTA 배너 구조를 참고해, 페이지 하단에서 함께 만들 동료 모집을 강하게 전달한다.

### 레이아웃

- 전체 폭 배너
- 좌측 텍스트
- 우측 이미지 또는 배경 이미지
- 어두운 overlay 가능
- CTA 버튼 1개

### 제목

```text
일상 속에서 자연스럽게 쓰이는 캘린더를 함께 만들 사람을 찾고 있습니다.
```

### 설명

```text
tryna는 아직 완성된 제품이 아닙니다. 그래서 지금 필요한 사람은 정해진 기능을 단순히 구현하는 사람이 아니라, 문제와 방향을 함께 다듬고 만들어갈 동료입니다.
```

### 모집 역할

```text
Product Designer
Frontend Developer
Backend Developer
```

### CTA

```text
지원하기
```

### 링크 처리

환경변수 사용:

```text
VITE_APPLY_LINK=https://forms.gle/example
```

동작:

- `VITE_APPLY_LINK`가 있으면 해당 링크로 이동
- 없으면 `#recruiting` 섹션으로 이동

---

## 12. Footer

### 구성

```text
tryna
일정과 챙길 일을 한 흐름으로 정리하는 일상 캘린더.
© 2026 tryna. All rights reserved.
```

선택 링크:

```text
Instagram
GitHub
Contact
```

---

## 13. 이미지 애셋 정리

### 13.1 레퍼런스 이미지 사용

Codex가 시각 구조를 참고할 수 있도록 레퍼런스 스크린샷을 별도 파일로 넣는다.

권장 경로:

```text
/public/assets/reference/landing-reference.png
```

사용 원칙:

```text
이 이미지는 레이아웃 흐름과 섹션 리듬만 참고한다.
브랜드명, 문구, 이미지 소재, 색상, UI 디테일을 복제하지 않는다.
```

Codex 프롬프트에는 특정 서비스명을 반복해서 쓰기보다 “첨부 레퍼런스” 또는 “회사소개형 랜딩 레이아웃”이라고 표현한다.

---

### 13.2 tryna 랜딩 이미지

아래 폴더에 이미지를 넣는다.

```text
/public/assets/landing
```

필요 이미지:

```text
lifestyle-01.png
lifestyle-02.png
lifestyle-03.png
lifestyle-04.png
lifestyle-05.png
lifestyle-06.png
service-input.png
service-task.png
service-today.png
service-team.png
hero-wireframe-mockup.png
problem-context.png
recruiting-banner.png
```

이미지가 없을 경우:

- 실제 앱 UI를 임의로 만들지 않는다.
- placeholder 카드로 대체한다.
- 레이아웃은 깨지지 않아야 한다.

---

## 14. 모션 디렉션

Motion for React를 사용한다.

### 허용 모션

```text
섹션 fade-up
카드 stagger 등장
Hero 이미지 부드러운 등장
CTA hover scale 1.02 이하
이미지 카드 hover 시 아주 약한 이동
```

### 금지 모션

```text
과한 패럴랙스
빠른 회전
3D 오브젝트 회전
네온 입자 효과
AI SaaS 느낌의 빛나는 그리드
텍스트 타이핑 효과
계속 흔들리는 배경
강한 bounce
```

### 수치 기준

```text
duration: 0.4s ~ 0.6s
Hero visual duration: 0.6s ~ 0.8s
staggerChildren: 0.06s ~ 0.1s
hover scale: 최대 1.02
translateY: 16px ~ 32px
spring bounce: 0 또는 0.1 이하
```

---

## 15. 스타일 가이드

### 전체 톤

```text
밝음
여백 많음
일상적
차분함
과한 SaaS 느낌 지양
```

### 컬러

기본값:

```text
Background: #FFFFFF
Section Background: #F6F7F8
Text Primary: #1F2933
Text Secondary: #6B7280
Border: #E5E7EB
Accent: #111827
```

브랜드 컬러가 정해지면 Accent만 교체한다.

### 폰트

```text
SF Pro
Pretendard
Apple SD Gothic Neo
system-ui
```

### 레이아웃

```text
max-width: 1120px
section padding desktop: 96px 24px
section padding mobile: 64px 20px
card radius: 20px ~ 28px
shadow: 약하게
```

---

## 16. 컴포넌트 구조

```text
/src
  /components
    Header.tsx
    Hero.tsx
    LifestyleRail.tsx
    ProblemContext.tsx
    ServiceDirection.tsx
    ProductPreview.tsx
    RecruitingBanner.tsx
    Footer.tsx
    /ui
  /lib
    constants.ts
    motion.ts
    utils.ts
  App.tsx
  main.tsx
  index.css
```

---

## 17. shadcn/ui 사용 범위

사용 컴포넌트:

```text
Button
Card
Badge
Separator
Sheet
```

사용하지 않을 컴포넌트:

```text
Calendar
Date Picker
Data Table
Sidebar
Chart
Command
```

---

## 18. 반응형 기준

### Desktop

- Hero 텍스트는 넓은 여백을 두고 중앙 또는 좌측 정렬
- Lifestyle Rail은 가로 카드 5개 이상 노출
- Service Direction은 이미지와 텍스트 2열 구성
- Recruiting Banner는 좌우 분할 구성

### Mobile

- Header 메뉴 축소
- Hero 카피 줄바꿈 자연스럽게 처리
- Lifestyle Rail은 가로 스크롤
- Service Direction은 1열
- Recruiting Banner는 세로 배치

---

## 19. SEO

### title

```text
tryna - 일정과 챙길 일을 한 흐름으로
```

### description

```text
tryna는 일정과 함께 챙길 일, 준비물을 한곳에 가볍게 정리하는 일상 캘린더를 만들고 있습니다.
```

---

## 20. 완료 기준

1. 첨부 레퍼런스처럼 비전 소개 → 이미지 카드 → 문제 상황 → 방향 설명 → 동료 모집 흐름이 보인다.
2. 첫 화면에서 tryna의 방향이 이해된다.
3. 이미지가 없어도 placeholder로 레이아웃이 깨지지 않는다.
4. Codex가 임의로 앱 화면을 만들지 않는다.
5. `지원하기` CTA가 동작한다.
6. 모바일에서도 읽기 쉽다.
7. 모든 브랜드 표기는 `tryna`로 되어 있다.

---

## 21. Codex 작업 요청 프롬프트

```text
Vite, React, TypeScript, Tailwind CSS, shadcn/ui, Motion for React 기반으로 tryna 랜딩페이지를 구현해줘.

첨부한 회사소개형 랜딩페이지 레퍼런스의 구조를 참고하되, 내용은 tryna에 맞춰 새로 구성해줘.

레퍼런스 스크린샷은 /public/assets/reference/landing-reference.png 경로에 둘 예정이야. 이 이미지는 레이아웃 흐름, 섹션 리듬, 여백감만 참고하고, 브랜드명, 문구, 이미지 소재, 색상, UI 디테일은 복제하지 마.

페이지 흐름은 Header, Hero, Lifestyle Image Rail, Problem Context, Service Direction, Product Preview, Recruiting CTA Banner, Footer 순서로 구성해줘.

브랜드명은 항상 소문자 tryna로 표기해줘.

Hero 메인 카피는 다음 문장으로 해줘.
“캘린더에 적은 일정이, 하루의 흐름으로 이어지도록.”

Hero 서브 카피는 다음 문장으로 해줘.
“tryna는 일정과 함께 챙길 일, 준비물을 한곳에 가볍게 정리하는 일상 캘린더를 만들고 있습니다.”

Hero 아래에는 첨부 레퍼런스처럼 가로 이미지 카드 레일을 만들어줘. 이미지는 /public/assets/landing/lifestyle-01.png부터 lifestyle-06.png까지 사용하고, 이미지가 없으면 placeholder 카드로 대체해줘.

Problem Context 섹션은 연혁이나 진행 상태가 아니라 문제 상황을 보여줘. 제목은 “일정은 캘린더에 있는데, 챙길 일은 자주 흩어집니다.”로 하고, 캘린더에는 시간만 남음, 메모와 할 일이 흩어짐, 오늘 필요한 것만 보기 어려움이라는 3개 문제 카드를 넣어줘.

Service Direction 섹션은 4개 블록으로 만들어줘. 가볍게 적는 일정, 일정 옆에 붙는 챙길 일, 오늘 한 화면, 함께 다듬는 제품을 설명해줘.

Product Preview 섹션에서는 /public/assets/landing/hero-wireframe-mockup.png를 사용해줘. 이미지가 없으면 실제 앱 화면을 임의로 만들지 말고 “와이어프레임 이미지 준비 중” placeholder를 보여줘.

Recruiting CTA Banner는 페이지 하단에 크게 배치해줘. 제목은 “일상 속에서 자연스럽게 쓰이는 캘린더를 함께 만들 사람을 찾고 있습니다.”로 해줘.

CTA는 “지원하기”로 하고, VITE_APPLY_LINK 환경변수가 있으면 해당 링크로 이동하게 해줘. 없으면 #recruiting으로 이동하게 해줘.

shadcn/ui는 Button, Card, Badge, Separator, Sheet 정도만 사용해줘. Calendar, Date Picker, Data Table, Sidebar, Chart, Command는 사용하지 마.

Motion for React를 사용해서 섹션 fade-up, 카드 stagger, Hero visual 등장, CTA hover 정도만 적용해줘. 과한 패럴랙스, 네온 효과, 3D 회전, 텍스트 타이핑 효과, 강한 bounce는 사용하지 마.

전체 톤은 밝고 여백이 많은 일상 서비스 느낌으로 만들어줘. 과한 AI SaaS 느낌이나 생산성 대시보드 느낌은 피해야 해.

반응형은 desktop, tablet, mobile 모두 자연스럽게 처리해줘.
```
