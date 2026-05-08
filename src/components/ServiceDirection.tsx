import { ClipboardCheck, Plus, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import AssetImage from "@/components/AssetImage"
import { Card } from "@/components/ui/card"
import { serviceBlocks } from "@/lib/constants"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { cn } from "@/lib/utils"

const icons = [Plus, ClipboardCheck, Sparkles]

export default function ServiceDirection() {
  return (
    <section id="direction" className="section-padding bg-background">
      <div className="section-shell">
        <motion.div
          className="max-w-[820px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeUp}
        >
          <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-normal text-foreground sm:text-3xl lg:text-4xl">
            숨쉬듯 자연스러운 일상 캘린더 tryna
          </h2>
        </motion.div>

        <motion.div
          className="mt-16 grid gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={staggerContainer}
        >
          {serviceBlocks.map((block, index) => {
            const Icon = icons[index]

            return (
              <motion.article
                key={block.title}
                variants={fadeUp}
                className="grid gap-8 lg:grid-cols-[0.92fr_1fr] lg:items-center lg:gap-16"
              >
                <Card
                  className={cn(
                    "aspect-square overflow-hidden border-0 shadow-none",
                    block.accent,
                  )}
                >
                  <AssetImage
                    src={block.src}
                    alt={block.alt}
                    fallback={
                      <div className="flex h-full flex-col justify-between p-6 sm:p-8">
                        <div className="inline-flex size-12 items-center justify-center rounded-full bg-white/70 text-foreground">
                          <Icon className="size-5" />
                        </div>
                        <div className="space-y-3">
                          <div className="h-3 w-24 rounded-full bg-white/70" />
                          <div className="h-3 w-40 rounded-full bg-white/60" />
                          <div className="h-3 w-28 rounded-full bg-white/50" />
                        </div>
                      </div>
                    }
                  />
                </Card>
                <div>
                  <div className="mb-5 inline-flex size-11 items-center justify-center rounded-full bg-secondary">
                    <Icon className="size-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-normal text-foreground sm:text-2xl">
                    {block.title}
                  </h3>
                  <p className="mt-4 max-w-[520px] text-base leading-8 text-muted-foreground sm:text-lg">
                    {block.body}
                  </p>
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
