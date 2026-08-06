const INSTAGRAM_URL =
  'https://www.instagram.com/tryna.studio/?utm_source=ig_web_button_share_sheet';

function WebIntro() {
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-[min(360px,calc(100vw-426px))] shrink-0 flex-col items-start pt-[160px] lg:flex">
      <img
        src="/intro/cover.png"
        alt="tryna"
        className="h-auto max-h-[560px] w-full rounded-2xl object-contain"
      />

      <div className="mt-[24px] flex w-full items-start justify-between gap-[20px]">
        <p className="text-[18px] leading-[1.5] font-semibold text-foreground">
          인스타그램 팔로우하고
          <br />
          다이어리·캘린더 경품
          <br />
          받아가세요!
          <br />
          <br />
          tryna.studio
        </p>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="트라이나 인스타그램 새 탭에서 열기"
          className="shrink-0"
        >
          <img
            src="/intro/instarQR.png"
            alt="트라이나 인스타그램 QR 코드"
            className="h-[140px] w-[140px] object-contain"
          />
        </a>
      </div>
    </aside>
  );
}

export default WebIntro;
