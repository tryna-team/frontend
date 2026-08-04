import './CreateModalSkeleton.css';

const SKELETON_ITEM_COUNT = 4;

export default function CreateModalSkeleton() {
  return (
    <div className="flex w-full flex-col" role="status" aria-label="체크리스트 추천 중">
      <div className="flex w-full items-center px-1 py-2">
        <div className="create-modal-skeleton h-[22px] w-[139px] rounded-full" />
      </div>

      <div className="flex w-[353px] flex-col">
        {Array.from({ length: SKELETON_ITEM_COUNT }, (_, index) => (
          <div key={index}>
            <div className="h-px w-full shrink-0 bg-divider-default" aria-hidden="true" />

            <div className="flex h-[45px] w-full items-center py-3">
              <div className="create-modal-skeleton h-[22px] w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">AI가 체크리스트를 만들고 있습니다.</span>
    </div>
  );
}
