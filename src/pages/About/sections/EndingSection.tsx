export default function EndingSection() {
  return (
    <section
      aria-label="tryna 사용 방식"
      className="relative w-full overflow-hidden pt-[116px] lg:pt-[200px]"
    >
      <picture className="mx-auto block w-full max-w-[1280px]">
        <source
          media="(min-width: 1024px)"
          srcSet="/about/ending/ending_desktop.webp"
          width={2560}
          height={1182}
        />
        <img
          src="/about/ending/ending_mobile.webp"
          alt=""
          width={780}
          height={2244}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
        />
      </picture>

      <img
        src="/about/ending/ending_scene.webp"
        alt=""
        width={1440}
        height={480}
        loading="lazy"
        decoding="async"
        className="mt-[48px] block h-auto w-full lg:mt-[92px]"
      />

      <div className="sr-only">
        <h2>일정 하나만 적었는데, 준비할 일이 함께 정리됩니다.</h2>
        <ul>
          <li>말하듯 적어요.</li>
          <li>필요한 것을 제안받아요.</li>
          <li>필요한 순간 다시 확인해요.</li>
        </ul>
      </div>
    </section>
  );
}
