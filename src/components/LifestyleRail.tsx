import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { motion } from "motion/react"
import AssetImage from "@/components/AssetImage"
import { Badge } from "@/components/ui/badge"
import { lifestyleCards } from "@/lib/constants"
import { staggerContainer, fadeUp } from "@/lib/motion"
import { cn } from "@/lib/utils"

const placeholderColors = [
  "bg-[#EFFFF7]",
  "bg-[#F7F8F7]",
  "bg-[#EEF5F1]",
  "bg-[#F8F5EF]",
  "bg-[#F2F3F4]",
  "bg-[#ECF7F2]",
]

export default function LifestyleRail() {
  const [isPaused, setIsPaused] = useState(false)

  return (
    <section aria-label="일상 이미지" className="overflow-hidden py-12">
      <motion.div
        className="px-5 pb-4 sm:px-6 lg:px-[calc((100vw-1120px)/2+24px)]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={staggerContainer}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          className="lifestyle-marquee flex w-max"
          data-paused={isPaused}
        >
          <motion.div className="flex shrink-0 gap-4 pr-4" variants={staggerContainer}>
            {lifestyleCards.map((card, index) => (
              <LifestyleCard
                key={card.src}
                card={card}
                index={index}
                isDuplicate={false}
              />
            ))}
          </motion.div>
          <div aria-hidden="true" className="flex shrink-0 gap-4 pr-4">
            {lifestyleCards.map((card, index) => (
              <LifestyleCard
                key={`${card.src}-duplicate`}
                card={card}
                index={index}
                isDuplicate
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

type LifestyleCardProps = {
  card: (typeof lifestyleCards)[number]
  index: number
  isDuplicate: boolean
}

function LifestyleCard({ card, index, isDuplicate }: LifestyleCardProps) {
  return (
    <motion.article
      variants={isDuplicate ? undefined : fadeUp}
      whileHover={{ y: -4 }}
      className="relative h-[360px] w-[76vw] max-w-[360px] shrink-0 overflow-hidden border bg-secondary shadow-sm sm:h-[360px] sm:w-[360px] lg:w-[360px]"
    >
      <AssetImage
        src={card.src}
        alt={isDuplicate ? "" : card.alt}
        fallback={
          <div
            className={cn(
              "flex h-full w-full flex-col justify-between p-5",
              placeholderColors[index % placeholderColors.length],
            )}
          >
            <div className="ml-auto inline-flex size-10 items-center justify-center rounded-full bg-white/70 text-foreground">
              <ImageIcon className="size-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                이미지 준비 중
              </p>
            </div>
          </div>
        }
      />
      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100%-2rem)]">
        <Badge className="max-w-full border-white/80 bg-white/85 text-foreground shadow-sm backdrop-blur">
          {card.label}
        </Badge>
      </div>
    </motion.article>
  )
}
