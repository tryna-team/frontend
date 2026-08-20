import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router';

import { Button } from '@/components/common/Buttons';
import { PATH } from '@/routes/paths';

type AboutFloatingCtaProps = {
  isVisible: boolean;
};

export default function AboutFloatingCta({ isVisible }: AboutFloatingCtaProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed right-5 bottom-[max(24px,env(safe-area-inset-bottom))] left-5 z-50 md:right-[160px] md:bottom-[80px] md:left-auto"
        >
          <Button
            variant="LargeStrongFit"
            className="w-full bg-green-500 hover:bg-green-500 md:w-auto"
            onClick={() => navigate(PATH.HOME)}
          >
            앱 사용해 보기
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
