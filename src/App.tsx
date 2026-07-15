// src/App.tsx

import './App.css';

import Header from './components/common/Header/Header';

function App() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center gap-10 bg-grey-100 px-4 py-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-text-additional default-label-large">
          Daily · 텍스트 버튼
        </h2>

        <Header
          variant="daily"
          title="6월 4일 (목)"
          leading={{
            type: 'icon-text',
            text: '6월',
            onClick: () => console.log('이전 화면'),
          }}
          trailing={{
            type: 'text',
            text: '수정',
            onClick: () => console.log('수정 버튼'),
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-text-additional default-label-large">
          Daily · 메뉴 아이콘
        </h2>

        <Header
          variant="daily"
          title=""
          leading={{
            type: 'icon-text',
            text: '6월',
            onClick: () => console.log('이전 화면'),
          }}
          trailing={{
            type: 'menu',
            onClick: () => console.log('메뉴 열기'),
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-text-additional default-label-large">
          Modal · 기본
        </h2>

        <Header
          variant="modal"
          title="설정"
          leading={{
            type: 'none',
          }}
          trailing={{
            type: 'none',
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-text-additional default-label-large">
          Modal · Leading + Trailing
        </h2>

        <Header
          variant="modal"
          title="레이블 수정"
          leading={{
            type: 'icon',
            onClick: () => console.log('뒤로가기'),
          }}
          trailing={{
            type: 'text',
            text: '완료',
            onClick: () => console.log('완료 버튼'),
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-text-additional default-label-large">
          Modal · Trailing
        </h2>

        <Header
          variant="modal"
          title="설정"
          leading={{
            type: 'none',
          }}
          trailing={{
            type: 'text',
            text: '닫기',
            onClick: () => console.log('닫기 버튼'),
          }}
        />
      </section>
    </main>
  );
}

export default App;