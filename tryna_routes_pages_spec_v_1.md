# tryna 라우팅 및 서브페이지 명세서 v1

## 1. 목적

현재 tryna 랜딩페이지는 한 페이지 안에서 섹션으로 이동하는 구조다.

다음 단계에서는 상단 네비게이션을 스크롤 앵커가 아닌 실제 라우트 이동으로 변경한다.

이번 명세의 목적은 페이지 콘텐츠를 구현하기 전에, 라우팅 구조와 신규 서브페이지의 역할, 레이아웃 방향, 개발 규칙을 먼저 정리하는 것이다.

서비스 소개 페이지는 기존 `tryna_landing_page_spec_v_1.md`를 그대로 따른다.

이 문서에서는 서비스 소개 페이지의 콘텐츠 명세를 다시 작성하지 않는다.

신규 명세 대상은 아래 3개 페이지다.

```text
팀문화
지원
멤버소개
```

각 페이지 콘텐츠 본문은 아직 확정하지 않는다. 초기에는 placeholder 또는 최소 skeleton만 둔다.

---

## 2. 참고 레퍼런스 사용 원칙

첨부 레퍼런스는 회사소개형/채용형 사이트의 구조를 참고하기 위한 용도다.

참고할 것:

- 상단 네비게이션이 페이지 라우트 단위로 이동하는 구조
- 넓은 상단 hero 영역
- 큰 제목과 짧은 설명 문장
- 전체 폭 이미지 배너
- 채용/지원 페이지의 필터와 리스트 레이아웃
- 팀문화 페이지의 카드 레일, 이미지 섹션, 복지/문화 설명 흐름
- 하단 CTA 배너와 Footer 흐름

복제하지 않을 것:

- 브랜드명
- 문구
- 이미지 소재
- 색상
- 아이콘 형태
- 상세 UI 디테일
- 특정 회사의 조직/채용 정보

브랜드명은 항상 소문자 `tryna`로 표기한다.

---

## 3. 라우트 구조

상단 네비게이션은 총 4개 메뉴로 구성한다.

```text
서비스 소개
팀문화
지원
멤버소개
```

라우트는 영어 path로 관리한다.

```text
/service   서비스 소개
/culture   팀문화
/apply     지원
/members   멤버소개
```

루트 `/`는 서비스 소개 페이지로 연결한다.

권장 방식:

```text
/          -> /service redirect 또는 ServiceIntroPage 렌더링
/service   -> ServiceIntroPage
/culture   -> CulturePage
/apply     -> ApplyPage
/members   -> MembersPage
/*         -> NotFoundPage
```

`/service` 콘텐츠는 기존 `tryna_landing_page_spec_v_1.md`를 그대로 따른다.

---

## 4. 네비게이션 동작

### 4.1 Desktop

Header 구성:

```text
좌측: tryna 로고
우측: 서비스 소개 / 팀문화 / 지원 / 멤버소개
```

동작:

- 로고 클릭 시 `/service` 이동
- 메뉴 클릭 시 해당 라우트로 이동
- 현재 라우트에 해당하는 메뉴는 active 스타일 적용
- 스크롤 앵커(`#problem`, `#direction`, `#recruiting`)는 Header 메뉴에서 사용하지 않는다
- Header는 기존처럼 sticky 유지
- 스크롤 시 흰색 반투명 배경과 blur 유지

### 4.2 Mobile

모바일에서는 Sheet 메뉴를 사용한다.

Sheet 메뉴 항목:

```text
서비스 소개
팀문화
지원
멤버소개
```

동작:

- 메뉴 클릭 시 Sheet를 닫고 라우트 이동
- 현재 라우트 active 스타일 적용
- CTA는 `/apply`로 이동

---

## 5. CTA 링크 정책

페이지 내부의 기본 CTA는 내부 지원 페이지로 이동한다.

```text
지원하기 -> /apply
```

실제 외부 지원 폼으로 이동하는 최종 버튼은 지원 페이지 내부에서만 처리한다.

환경변수:

```text
VITE_APPLY_LINK=https://forms.gle/example
```

지원 페이지 내부의 최종 CTA 동작:

- `VITE_APPLY_LINK`가 있으면 해당 링크 새 창 이동
- 없으면 `/apply` 내 안내 섹션 또는 준비 중 상태 표시

이렇게 하면 상단 네비게이션은 항상 라우팅 역할을 하고, 외부 폼 이동은 지원 페이지에서만 관리된다.

---

## 6. 기술 변경

라우팅을 위해 `react-router-dom`을 추가한다.

설치:

```bash
npm install react-router-dom
```

앱 엔트리:

```tsx
import { BrowserRouter } from "react-router-dom"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

라우트 선언은 `src/app/routes.tsx` 또는 `src/app/router.tsx`에서 관리한다.

---

## 7. 권장 폴더 구조

주니어 개발자가 주도할 예정이므로 full FSD를 바로 적용하지 않는다.

FSD-inspired 구조로 시작한다.

```text
src/
  app/
    App.tsx
    main.tsx
    routes.tsx

  pages/
    service/
      ServicePage.tsx
      index.ts
    culture/
      CulturePage.tsx
      index.ts
    apply/
      ApplyPage.tsx
      index.ts
    members/
      MembersPage.tsx
      index.ts
    not-found/
      NotFoundPage.tsx
      index.ts

  widgets/
    header/
      Header.tsx
    footer/
      Footer.tsx

  shared/
    ui/
      button.tsx
      card.tsx
      badge.tsx
      separator.tsx
      sheet.tsx
    lib/
      utils.ts
      motion.ts
    config/
      navigation.ts
      links.ts
```

초기에는 `features`, `entities` 레이어를 만들지 않는다.

추후 실제 서비스 기능이 생기면 그때 추가한다.

예:

```text
features/
  apply-form/
  schedule-preview/

entities/
  member/
  job-post/
  value/
```

---

## 8. 공통 레이아웃

모든 페이지는 같은 레이아웃을 공유한다.

```text
Header
Page Content
Footer
```

공통 스타일:

- 밝은 배경
- 넓은 여백
- 차분한 일상 서비스 톤
- 과한 SaaS 대시보드 느낌 금지
- 과한 그라데이션, 네온, 3D 효과 금지
- 모바일/태블릿/데스크톱 모두 자연스럽게 대응

공통 Motion:

- 페이지 진입 fade-up
- 카드 stagger
- CTA hover scale 최대 1.02
- 강한 bounce 금지
- 패럴랙스 과다 사용 금지

---

## 9. 신규 페이지별 명세

서비스 소개 페이지는 이 섹션에서 다루지 않는다.

서비스 소개 페이지 콘텐츠는 기존 `tryna_landing_page_spec_v_1.md`를 기준으로 유지한다.

---

## 9.1 팀문화 페이지

라우트:

```text
/culture
```

역할:

tryna가 어떤 방식으로 일하고, 어떤 기준으로 팀을 만들어가는지 소개한다.

레퍼런스에서 참고할 흐름:

- 상단 hero에서 팀의 일하는 방식을 큰 문장으로 소개
- 짧은 설명 문단
- 구성원 코멘트 카드 레일
- 팀 이미지 또는 오피스/작업 공간 이미지 배너
- 일하는 원칙, 커뮤니케이션 방식, 성장 방식 소개
- 복지/지원 항목 리스트
- 하단 지원 CTA 배너

권장 섹션:

```text
Culture Hero
Team Voice Rail
Working Principles
Image Banner
Ways of Working
Benefits / Support
Apply CTA Banner
Footer
```

초기 placeholder 방향:

- 실제 멤버 코멘트가 없으면 quote card skeleton만 배치
- 실제 팀 사진이 없으면 이미지 placeholder 사용
- 임의의 실제 인물명, 직무, 사진은 만들지 않는다

이미지 경로 후보:

```text
/public/assets/culture/culture-hero.png
/public/assets/culture/team-working.png
/public/assets/culture/office-01.png
/public/assets/culture/office-02.png
/public/assets/culture/office-03.png
```

---

## 9.2 지원 페이지

라우트:

```text
/apply
```

역할:

tryna에 합류하고 싶은 사람이 현재 모집 맥락과 지원 방법을 확인하는 페이지다.

레퍼런스에서 참고할 흐름:

- 상단 hero에 큰 제목과 지원 맥락 소개
- 전체 폭 이미지 배너
- 채용 중인 직무 영역
- 직무 리스트
- floating 또는 하단 CTA

단, 초기에는 실제 채용 콘텐츠를 만들지 않는다.

필터 UI는 사용하지 않는다.

초기 구현:

```text
Apply Hero
Open Role Links
Footer
```

Open Role Links는 아래 3개 상세페이지 링크만 제공한다.

```text
Product Designer
Frontend Developer
Backend Developer
```

향후 확장 섹션:

```text
Job List
Job Detail Route
Application Process
FAQ
```

채용 상세 라우트:

```text
/apply/:jobId
```

초기에는 상세 내용을 작성하지 않고, 각 역할별 placeholder 상세 페이지로만 연결한다.

데이터 구조 후보:

```ts
type JobPost = {
  id: string
  title: string
}
```

지원 페이지의 최종 지원 버튼:

- `VITE_APPLY_LINK`가 있으면 외부 링크 새 창 이동
- 없으면 준비 중 상태 표시

이미지 경로 후보:

```text
/public/assets/apply/apply-hero.png
/public/assets/apply/recruiting-banner.png
```

---

## 9.3 멤버소개 페이지

라우트:

```text
/members
```

역할:

tryna를 함께 만드는 사람들을 소개한다.

초기에는 실제 멤버 콘텐츠를 만들지 않는다.

권장 섹션:

```text
Members Hero
Team Intro
Member Grid Placeholder
How We Collaborate
Apply CTA Banner
Footer
```

멤버 카드 후보 정보:

```ts
type Member = {
  id: string
  name: string
  role: string
  bio: string
  imageSrc?: string
}
```

초기 placeholder 방향:

- 실제 멤버 사진과 이름이 준비되기 전까지 skeleton/card placeholder 사용
- 임의의 인물명, 직무, 프로필 이미지를 만들지 않는다
- 멤버소개 페이지가 비어 보이지 않도록 “멤버 소개 준비 중” 상태를 명확히 표시

이미지 경로 후보:

```text
/public/assets/members/member-01.png
/public/assets/members/member-02.png
/public/assets/members/member-03.png
```

---

## 10. Header 네비게이션 데이터

네비게이션은 한 곳에서 관리한다.

권장 파일:

```text
src/shared/config/navigation.ts
```

데이터:

```ts
export const navigationItems = [
  { label: "서비스 소개", path: "/service" },
  { label: "팀문화", path: "/culture" },
  { label: "지원", path: "/apply" },
  { label: "멤버소개", path: "/members" },
]
```

Header에서는 `NavLink`를 사용한다.

```tsx
<NavLink
  to={item.path}
  className={({ isActive }) =>
    isActive ? "text-foreground" : "text-muted-foreground"
  }
>
  {item.label}
</NavLink>
```

---

## 11. Not Found 페이지

라우트:

```text
/*
```

역할:

존재하지 않는 경로로 접근했을 때 `/service`로 돌아갈 수 있게 한다.

구성:

```text
짧은 안내 문구
서비스 소개로 돌아가기 버튼
```

---

## 12. SEO

페이지별 title/description을 나눈다.

```text
/service
title: tryna - 일정과 챙길 일을 한 흐름으로
description: tryna는 일정과 함께 챙길 일, 준비물을 한곳에 가볍게 정리하는 일상 캘린더를 만들고 있습니다.

/culture
title: tryna - 팀문화
description: tryna가 어떤 방식으로 일하고 제품을 함께 다듬어가는지 소개합니다.

/apply
title: tryna - 지원
description: 일상 속에서 자연스럽게 쓰이는 캘린더를 함께 만들 사람을 찾고 있습니다.

/members
title: tryna - 멤버소개
description: tryna를 함께 만드는 사람들을 소개합니다.
```

초기에는 `react-helmet-async` 없이 `document.title`을 페이지 진입 시 갱신해도 된다.

---

## 13. 배포 설정

SPA 라우팅을 사용하므로 정적 배포 시 fallback 설정이 필요하다.

Vercel:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

Netlify:

```text
/* /index.html 200
```

---

## 14. 구현 순서

1. `react-router-dom` 설치
2. `src/app` 구조 생성
3. 현재 `App.tsx`, `main.tsx`를 `src/app`으로 이동
4. `routes.tsx` 작성
5. Header 메뉴를 `a href="#..."`에서 `NavLink to="..."`로 변경
6. 모바일 Sheet 메뉴도 라우트 이동으로 변경
7. `/service`는 기존 랜딩 명세 기반 콘텐츠를 그대로 연결
8. `/culture`, `/apply`, `/members`는 최소 placeholder 페이지 생성
9. `/` 접근 시 `/service`로 redirect 또는 기존 랜딩 콘텐츠 렌더링
10. NotFound 페이지 추가
11. build/lint 검증

---

## 15. 완료 기준

1. Header 메뉴 4개가 모두 라우트 이동으로 동작한다.
2. Header에서 스크롤 앵커 링크를 사용하지 않는다.
3. `/service`, `/culture`, `/apply`, `/members`에 직접 접근 가능하다.
4. 모바일 Sheet에서도 동일하게 라우트 이동한다.
5. 기존 서비스 소개/랜딩 콘텐츠 명세는 `tryna_landing_page_spec_v_1.md`를 그대로 따른다.
6. 신규 페이지 3개는 임의 내용을 채우지 않고 placeholder로만 표시한다.
7. 모든 브랜드 표기는 `tryna`로 되어 있다.
8. build와 lint가 통과한다.
