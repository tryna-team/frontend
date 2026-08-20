import { motion, useScroll, useTransform } from 'framer-motion';

export default function AboutHeader() {
  const { scrollY } = useScroll();
  const backgroundOpacity = useTransform(scrollY, [0, 96], [0, 1]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[72px] w-full">
      <motion.div
        aria-hidden="true"
        style={{ opacity: backgroundOpacity }}
        className="absolute inset-0 bg-background-white"
      />

      <div className="relative mx-auto flex h-full w-full max-w-[1040px] items-center px-5">
        <img
          src="/icon/logo/primary_lockup.svg"
          alt="tryna"
          width={160}
          height={52}
          className="h-8 w-auto"
        />
      </div>
    </header>
  );
}
