import './App.css';

import Button from '@/components/common/Buttons/Button';

function App() {
  return (
    <div className="flex min-h-screen flex-col gap-8 p-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">IconText / gap</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="IconText" icon="chevron/left_medium.svg" gap="small" size={32}>
            6월
          </Button>
          <div className="w-full" />
          <Button variant="IconText" icon="chevron/left_medium.svg" gap="medium" size={32}>
            6월
          </Button>
        </div>
      </section>
    </div>
  );
}

export default App;
