import { motion } from "motion/react"
import AssetImage from "@/components/AssetImage"
import { Card } from "@/components/ui/card"
import { productPreviewImages } from "@/lib/constants"
import { fadeUp } from "@/lib/motion"

export default function ProductPreview() {
  return (
    <section className="bg-[#F7F8F7] section-padding">
      <div className="section-shell">
        <motion.div
          className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
        >
          <div>
            <h2 className="mt-5 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              지금 만들고 있는 화면
            </h2>
            <p className="mt-5 max-w-[520px] text-base leading-8 text-muted-foreground sm:text-lg">
              tryna는 홈에서 오늘의 일정과 그 일정에 연결된 할 일,
              준비물을 함께 확인하는 방향으로 설계하고 있습니다.
            </p>
          </div>

          <Card className="overflow-hidden border-0 bg-white soft-shadow">
            <div className="relative min-h-[360px] overflow-hidden bg-[#F3FAF6] px-5 py-8 sm:min-h-[520px] sm:px-10 sm:py-12">
              <div className="absolute inset-x-0 top-0 h-28 bg-white/70" />
              <div className="relative mx-auto grid max-w-[760px] grid-cols-2 items-end gap-4 sm:grid-cols-4 sm:gap-5">
                {productPreviewImages.map((image, index) => (
                  <motion.div
                    key={image.src}
                    className="min-w-0"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ delay: index * 0.08, duration: 0.45 }}
                  >
                    <AssetImage
                      src={image.src}
                      alt={image.alt}
                      className="mx-auto h-auto w-full max-w-[160px] object-contain drop-shadow-[0_18px_28px_rgba(16,24,40,0.12)] sm:max-w-[190px]"
                      fallback={
                        <div className="aspect-[908/1816] w-full max-w-[160px] rounded-[30px] bg-white sm:max-w-[190px]" />
                      }
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
