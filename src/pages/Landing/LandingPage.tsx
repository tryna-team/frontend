import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Check, Pause, Play, Plus, X } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import { Link } from 'react-router';

import { PATH } from '@/routes/paths';

import ShinyText from './glintkit/shiny-text';
import styles from './LandingPage.module.css';

type LandingScene = {
  id: string;
  number: string;
  label: string;
  title: string;
  image: string;
  imageAlt: string;
  input: string;
  date: string;
  missed: string[];
  suggestions: string[];
  benefitTitle: string;
  benefitBody: string;
};

const SCENES: LandingScene[] = [
  {
    id: 'presentation',
    number: '01',
    label: '발표 일정',
    title: '발표 일정은 기억했지만',
    image: '/landing/scene/lifestyle-07.png',
    imageAlt: '발표를 준비하는 노트북과 발표자',
    input: '금요일 3시 졸업 프로젝트 발표',
    date: '5월 29일 · 금요일 오후 3:00',
    missed: ['발표 자료 최종본 저장', '노트북 충전', 'USB 준비'],
    suggestions: ['발표 자료 최종 점검', '발표 연습', '노트북 준비', '팀원에게 최종본 공유'],
    benefitTitle: '따로 정리하지 않아도',
    benefitBody: '일정과 준비물을 여러 앱에 나누어 적는 과정을 줄입니다.',
  },
  {
    id: 'travel',
    number: '02',
    label: '여행 일정',
    title: '여행 날짜는 기억했지만',
    image: '/landing/scene/lifestyle-04.png',
    imageAlt: '외출을 앞두고 신발을 신는 사람과 현관의 가방',
    input: '토요일 제주도 여행',
    date: '6월 13일 · 토요일',
    missed: ['온라인 체크인', '신분증 확인', '보조배터리 챙기기'],
    suggestions: ['온라인 체크인', '신분증 확인', '보조배터리 챙기기'],
    benefitTitle: '매번 다시 찾지 않아도',
    benefitBody: '필요한 준비와 행동이 일정에 연결되어 함께 보입니다.',
  },
  {
    id: 'hospital',
    number: '03',
    label: '병원 일정',
    title: '병원 예약은 기억했지만',
    image: '/landing/scene/lifestyle-06.png',
    imageAlt: '병원 대기실에서 차례를 기다리는 사람',
    input: '다음 주 화요일 병원 방문',
    date: '6월 16일 · 화요일 오전 10:30',
    missed: ['이전 검사 결과 준비', '복용 중인 약 확인', '보험 관련 서류 챙기기'],
    suggestions: ['이전 검사 결과 준비', '복용 중인 약 확인', '보험 관련 서류 챙기기'],
    benefitTitle: '모든 것을 기억하지 않아도',
    benefitBody: '필요한 순간에 tryna가 다시 보여줍니다.',
  },
];

const VALUE_ITEMS = [
  {
    number: '01',
    title: '잘 기억하기',
    body: '중요한 일정과 연결된 맥락을 함께 기억합니다.',
  },
  {
    number: '02',
    title: '잘 챙기기',
    body: '필요한 준비물과 해야 할 일을 자연스럽게 확인합니다.',
  },
  {
    number: '03',
    title: '마음 놓기',
    body: '혹시 놓친 것이 없는지 계속 신경 쓰는 부담을 줄입니다.',
  },
];

const TRUST_ITEMS = ['발표 자료 최종 점검', '노트북 충전하기', '팀원에게 최종본 공유'];

const GENTLE_EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const HERO_SEQUENCE: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.16,
      staggerChildren: 0.09,
    },
  },
};

const HERO_ITEM: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: GENTLE_EASE },
  },
};

const SUGGESTION_SEQUENCE: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.055,
    },
  },
};

const SUGGESTION_ITEM: Variants = {
  hidden: { opacity: 0, y: 7 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: GENTLE_EASE },
  },
};

const AHA_SEQUENCE: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const AHA_ITEM: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: GENTLE_EASE },
  },
};

function ProductStage({ scene, compact = false }: { scene: LandingScene; compact?: boolean }) {
  return (
    <motion.figure
      className={`${styles.productStage} ${compact ? styles.productStageCompact : ''}`}
      initial={{ opacity: 0, y: compact ? 16 : 10, scale: 0.985 }}
      animate={compact ? undefined : { opacity: 1, y: 0, scale: 1 }}
      whileInView={compact ? { opacity: 1, y: 0, scale: 1 } : undefined}
      exit={compact ? undefined : { opacity: 0, y: -6, scale: 1.005 }}
      viewport={compact ? { once: true, amount: 0.2 } : undefined}
      transition={{ duration: compact ? 0.48 : 0.34, ease: GENTLE_EASE }}
    >
      <img
        className={styles.stagePhoto}
        src={scene.image}
        alt={scene.imageAlt}
        width="1254"
        height="1254"
        loading="lazy"
        decoding="async"
      />
      <div className={styles.stageShade} />

      <div className={styles.scheduleCard}>
        <div className={styles.scheduleCardTopline}>
          <span>tryna</span>
          <span>{scene.label}</span>
        </div>

        <div className={styles.naturalInput}>
          <span>{scene.input}</span>
          <i aria-hidden="true" />
        </div>

        <div className={styles.eventSummary}>
          <span className={styles.eventDot} />
          <div>
            <strong>{scene.input.replace(/^(금요일 3시|토요일|다음 주 화요일)\s*/, '')}</strong>
            <span>{scene.date}</span>
          </div>
        </div>

        <div className={styles.suggestionPanel}>
          <div className={styles.suggestionHeading}>
            <span>함께 챙겨볼까요?</span>
            <span>{scene.suggestions.length}</span>
          </div>
          <motion.ul
            variants={SUGGESTION_SEQUENCE}
            initial="hidden"
            animate={compact ? undefined : 'visible'}
            whileInView={compact ? 'visible' : undefined}
            viewport={compact ? { once: true, amount: 0.4 } : undefined}
          >
            {scene.suggestions.map((item) => (
              <motion.li key={item} variants={SUGGESTION_ITEM}>
                <span className={styles.checkCircle}>
                  <Check aria-hidden="true" />
                </span>
                <span>{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </motion.figure>
  );
}

function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedTrustItems, setSelectedTrustItems] = useState(() => new Set(TRUST_ITEMS));
  const [customTrustItemAdded, setCustomTrustItemAdded] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    const previousLanguage = document.documentElement.lang;
    document.title = 'tryna — 일상의 작은 것들을 놓치지 않도록';
    document.documentElement.lang = 'ko';

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLanguage;
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) videoRef.current?.pause();
  }, [prefersReducedMotion]);

  useEffect(() => {
    const revealElements = pageRef.current?.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!revealElements?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = 'true';
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;
        const index = Number((visibleEntry.target as HTMLElement).dataset.sceneIndex);
        if (!Number.isNaN(index)) setActiveSceneIndex(index);
      },
      { rootMargin: '-24% 0px -32% 0px', threshold: [0.15, 0.35, 0.6] },
    );

    stepRefs.current.forEach((step) => {
      if (step) observer.observe(step);
    });

    return () => observer.disconnect();
  }, []);

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const toggleTrustItem = (item: string) => {
    setSelectedTrustItems((currentItems) => {
      const nextItems = new Set(currentItems);
      if (nextItems.has(item)) nextItems.delete(item);
      else nextItems.add(item);
      return nextItems;
    });
  };

  const activeScene = SCENES[activeSceneIndex];
  const selectedTrustItemCount = selectedTrustItems.size + Number(customTrustItemAdded);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={pageRef} className={styles.landing}>
        <a className={styles.skipLink} href="#landing-content">
          본문으로 건너뛰기
        </a>

        <header className={styles.header}>
          <a className={styles.logoLink} href="#top" aria-label="tryna 랜딩페이지 처음으로">
            <img src="/icon/logo/primary_lockup.svg" alt="tryna" width="160" height="52" />
          </a>

          <nav className={styles.nav} aria-label="랜딩페이지 주요 메뉴">
            <a href="#point-of-view">우리의 생각</a>
            <a href="#experience">핵심 경험</a>
            <a href="#trust">선택과 신뢰</a>
          </nav>

          <Link className={styles.headerCta} to={PATH.HOME}>
            시작하기
            <ArrowRight aria-hidden="true" />
          </Link>
        </header>

        <main id="landing-content">
          <section id="top" className={styles.hero}>
            <div className={styles.heroMedia}>
              <img
                className={styles.heroFallback}
                src="/landing/scene/lifestyle-03.png"
                alt="따뜻한 조명 아래 노트북과 노트를 펼쳐 둔 일상"
                width="1254"
                height="1254"
              />
              <video
                ref={videoRef}
                className={`${styles.heroVideo} ${isVideoReady ? styles.heroVideoReady : ''}`}
                src="/BlendDimVideo.mp4"
                poster="/landing/scene/lifestyle-03.png"
                autoPlay={!prefersReducedMotion}
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                onLoadedData={() => setIsVideoReady(true)}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onError={() => setIsVideoReady(false)}
              />
              <div className={styles.heroVeil} />
            </div>

            <motion.div
              className={styles.heroContent}
              variants={HERO_SEQUENCE}
              initial="hidden"
              animate="visible"
            >
              <motion.p className={styles.heroEyebrow} variants={HERO_ITEM}>
                <ShinyText
                  text="A CALENDAR FOR A LIGHTER DAY"
                  color="#5ee9a3"
                  shineColor="#ffffff"
                  speed={2.8}
                  delay={1.9}
                  spread={115}
                  disabled={prefersReducedMotion}
                />
              </motion.p>
              <motion.h1 variants={HERO_ITEM}>
                일상의 작은
                <br className={styles.mobileTitleBreak} /> 것들을
                <br />
                놓치지 않도록.
              </motion.h1>
              <motion.p className={styles.heroBody} variants={HERO_ITEM}>
                일정은 기억해도
                <br />
                그날 필요한 것까지 모두 기억하기는 어려우니까.
              </motion.p>
              <motion.div className={styles.heroActions} variants={HERO_ITEM}>
                <Link className={styles.primaryCta} to={PATH.HOME}>
                  tryna 시작하기
                  <ArrowRight aria-hidden="true" />
                </Link>
                <a className={styles.textCta} href="#experience">
                  어떻게 돕나요
                  <ArrowDown aria-hidden="true" />
                </a>
              </motion.div>
            </motion.div>

            <div className={styles.heroFooter}>
              <span>Scroll to discover</span>
              <ArrowDown aria-hidden="true" />
            </div>

            {isVideoReady && (
              <button
                className={styles.videoControl}
                type="button"
                onClick={toggleVideo}
                aria-label={isVideoPlaying ? '배경 영상 일시 정지' : '배경 영상 재생'}
              >
                {isVideoPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              </button>
            )}
          </section>

          <section id="point-of-view" className={styles.pointOfView}>
            <div className={styles.pointCopy} data-reveal>
              <p className={styles.sectionEyebrow}>OUR POINT OF VIEW</p>
              <h2>
                잘 살아간다는 건
                <br />
                모든 것을 기억하는 게 아니니까.
              </h2>
              <p>
                우리는 사람들이 더 많은 계획을 세우고 모든 일을 완벽하게 관리해야 한다고 생각하지
                않습니다. 중요한 순간에 필요한 것들을 덜 놓치고, 계속 신경 쓰지 않아도 되는 일상.
                tryna는 그런 하루를 돕는 캘린더를 만듭니다.
              </p>
            </div>

            <div className={styles.photoMosaic}>
              {[
                ['01', '발표를 준비하는 오후'],
                ['02', '함께 맞춰보는 일정'],
                ['03', '조용히 이어지는 하루'],
                ['05', '다음 장소로 향하는 길'],
              ].map(([imageNumber, caption], index) => (
                <figure key={imageNumber} className={styles[`mosaicItem${index + 1}`]} data-reveal>
                  <img
                    src={`/landing/scene/lifestyle-${imageNumber}.png`}
                    alt={caption}
                    width="1254"
                    height="1254"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>{caption}</figcaption>
                </figure>
              ))}
            </div>

            <div className={styles.values}>
              {VALUE_ITEMS.map((item) => (
                <article key={item.number} data-reveal>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="experience" className={styles.experience}>
            <div className={styles.experienceIntro} data-reveal>
              <p className={styles.sectionEyebrow}>FROM SCHEDULE TO ACTION</p>
              <h2>
                우리는 일정을 잊는 것보다
                <br />
                <em>일정에 딸린 작은 것들</em>을 더 자주 놓칩니다.
              </h2>
            </div>

            <div className={styles.experienceLayout}>
              <div className={styles.storySteps}>
                {SCENES.map((scene, index) => (
                  <article
                    key={scene.id}
                    ref={(element) => {
                      stepRefs.current[index] = element;
                    }}
                    className={`${styles.storyStep} ${
                      activeSceneIndex === index ? styles.storyStepActive : ''
                    }`}
                    data-scene-index={index}
                  >
                    <div className={styles.storyTopline}>
                      <span>{scene.number}</span>
                      <span>{scene.label}</span>
                    </div>
                    <h3>{scene.title}</h3>
                    <ul className={styles.missedList}>
                      {scene.missed.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>

                    <div className={styles.storyOutcome}>
                      <span>그리고 tryna와 함께</span>
                      <strong>{scene.benefitTitle}</strong>
                      <p>{scene.benefitBody}</p>
                    </div>

                    <div className={styles.mobileStage}>
                      <ProductStage scene={scene} compact />
                    </div>

                    <span className={styles.srOnly}>
                      tryna가 제안하는 항목: {scene.suggestions.join(', ')}
                    </span>
                  </article>
                ))}
              </div>

              <div className={styles.stickyStage} aria-hidden="true">
                <AnimatePresence initial={false} mode="wait">
                  <ProductStage key={activeScene.id} scene={activeScene} />
                </AnimatePresence>
                <div className={styles.scenePagination}>
                  <span>{activeScene.number}</span>
                  <div>
                    {SCENES.map((scene, index) => (
                      <i
                        key={scene.id}
                        className={activeSceneIndex === index ? styles.paginationActive : ''}
                      />
                    ))}
                  </div>
                  <span>03</span>
                </div>
              </div>
            </div>

            <div className={styles.ahaMoment}>
              <motion.div
                variants={AHA_ITEM}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.45 }}
              >
                <p className={styles.sectionEyebrow}>THE AHA MOMENT</p>
                <h2>
                  일정 하나만 적었는데,
                  <br />
                  챙겨야 할 것들이 함께 정리됩니다.
                </h2>
              </motion.div>
              <motion.div
                className={styles.howItWorks}
                variants={AHA_SEQUENCE}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.24 }}
              >
                <motion.article variants={AHA_ITEM}>
                  <span>01</span>
                  <strong>말하듯 적어요</strong>
                  <p>복잡한 입력창 없이 평소 사용하는 문장으로 일정을 기록합니다.</p>
                </motion.article>
                <motion.article variants={AHA_ITEM}>
                  <span>02</span>
                  <strong>필요한 것을 제안받아요</strong>
                  <p>일정의 맥락을 이해하고 준비물과 해야 할 일을 먼저 제안합니다.</p>
                </motion.article>
                <motion.article variants={AHA_ITEM}>
                  <span>03</span>
                  <strong>필요한 순간 다시 확인해요</strong>
                  <p>일정 전 적절한 시점에 준비와 행동을 함께 확인합니다.</p>
                </motion.article>
              </motion.div>
              <motion.p
                className={styles.ahaClosing}
                variants={AHA_ITEM}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
                기억해야 할 것이 줄어들면
                <br />
                하루도 조금 가벼워집니다.
              </motion.p>
            </div>
          </section>

          <section id="trust" className={styles.trust}>
            <div className={styles.trustCopy} data-reveal>
              <p className={styles.sectionEyebrow}>YOUR DAY, YOUR CHOICE</p>
              <h2>
                tryna가 먼저 제안하고,
                <br />
                결정은 언제나 사용자가 합니다.
              </h2>
              <p>필요한 것만 남기고, 잘못된 제안은 지우고, 필요한 항목은 직접 더할 수 있습니다.</p>
            </div>

            <div className={styles.choiceDemo} data-reveal>
              <div className={styles.choiceDemoHeader}>
                <div>
                  <span>발표 일정</span>
                  <strong>제안된 준비</strong>
                </div>
                <AnimatePresence initial={false} mode="wait">
                  <motion.span
                    key={selectedTrustItemCount}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: GENTLE_EASE }}
                  >
                    {selectedTrustItemCount}개 선택
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className={styles.choiceList}>
                {TRUST_ITEMS.map((item) => {
                  const isSelected = selectedTrustItems.has(item);
                  return (
                    <motion.button
                      key={item}
                      layout="position"
                      type="button"
                      className={isSelected ? styles.choiceSelected : ''}
                      onClick={() => toggleTrustItem(item)}
                      aria-pressed={isSelected}
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.18, ease: GENTLE_EASE }}
                    >
                      <span>
                        {isSelected ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
                      </span>
                      {item}
                    </motion.button>
                  );
                })}

                <AnimatePresence initial={false}>
                  {customTrustItemAdded && (
                    <motion.button
                      layout
                      type="button"
                      className={styles.choiceSelected}
                      onClick={() => setCustomTrustItemAdded(false)}
                      aria-label="직접 추가한 물 한 병 챙기기 삭제"
                      initial={{ opacity: 0, y: -8, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.985 }}
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.24, ease: GENTLE_EASE }}
                    >
                      <span>
                        <Check aria-hidden="true" />
                      </span>
                      물 한 병 챙기기
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <button
                className={styles.addChoice}
                type="button"
                disabled={customTrustItemAdded}
                onClick={() => setCustomTrustItemAdded(true)}
              >
                <Plus aria-hidden="true" />
                {customTrustItemAdded ? '직접 추가했어요' : '직접 항목 추가'}
              </button>
            </div>
          </section>

          <section className={styles.finalCta}>
            <div className={styles.finalCtaContent} data-reveal>
              <img src="/favicon.svg" alt="" width="512" height="512" aria-hidden="true" />
              <p>오늘도 중요한 것만 기억하세요.</p>
              <h2>나머지는 tryna가 함께 기억할게요.</h2>
              <Link className={styles.finalCtaButton} to={PATH.HOME}>
                tryna 시작하기
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <img src="/icon/logo/primary_lockup.svg" alt="tryna" width="160" height="52" />
          <p>일상의 작은 것들을 놓치지 않도록.</p>
          <span>© 2026 tryna. All rights reserved.</span>
        </footer>
      </div>
    </MotionConfig>
  );
}

export default LandingPage;
