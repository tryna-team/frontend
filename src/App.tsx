import './App.css';

import IconButton from '@/components/common/Buttons/IconButton';

function App() {
  return (
    <div className="flex min-h-screen flex-col gap-8 p-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">IconButton</h2>
        <div className="flex flex-wrap items-center gap-3">
          <IconButton icon="icons/hamburger_medium.svg" alt="메뉴" onClick={() => console.log('hamburger clicked')} />
          <IconButton icon="icons/search_medium.svg" alt="검색" onClick={() => console.log('search clicked')} />
          <IconButton icon="icons/setting_medium.svg" alt="설정" onClick={() => console.log('setting clicked')} />
        </div>
      </section>
    </div>
  );
}

export default App;
