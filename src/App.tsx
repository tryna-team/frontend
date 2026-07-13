import './App.css';

import Button from '@/components/common/Buttons/Button';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-grey-500">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function App() {
  return (
    <div className="flex min-h-screen flex-col gap-8 p-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">hitArea</h2>

        <Row label="Icon / default (지정 안 함, 아이콘 크기 그대로)">
          <Button
            variant="Icon"
            icon="chevron/left_medium.svg"
            alt="기본"
            className="outline outline-dashed outline-grey-300"
          />
        </Row>

        <Row label='Icon / hitArea={40} (숫자, 40×40)'>
          <Button
            variant="Icon"
            icon="chevron/left_medium.svg"
            alt="40px"
            hitArea={40}
            className="outline outline-dashed outline-grey-300"
          />
        </Row>

        <Row label='Icon / hitArea="medium" (프리셋, 36×36)'>
          <Button
            variant="Icon"
            icon="chevron/left_medium.svg"
            alt="medium"
            hitArea="medium"
            className="outline outline-dashed outline-grey-300"
          />
        </Row>

        <Row label='IconText / hitArea={{ width: 80, height: "large" }} (80×48)'>
          <Button
            variant="IconText"
            icon="chevron/left_medium.svg"
            hitArea={{ width: 80, height: 'large' }}
            className="outline outline-dashed outline-grey-300"
          >
            Left
          </Button>
        </Row>

        <Row label='IconText / hitArea={{ w: 80, h: "large" }} (w/h 축약형, 동일하게 80×48)'>
          <Button
            variant="IconText"
            icon="chevron/left_medium.svg"
            hitArea={{ w: 80, h: 'large' }}
            className="outline outline-dashed outline-grey-300"
          >
            Left
          </Button>
        </Row>
      </section>
    </div>
  );
}

export default App;
