import { ImageIcon } from "lucide-react"
import { motion } from "motion/react"
import AssetImage from "@/components/AssetImage"
import { Card } from "@/components/ui/card"
import { fadeUp } from "@/lib/motion"

export default function ProductPreview() {
  return (
    <section className="bg-[#F6F7F8] section-padding">
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

          <Card className="min-h-[320px] overflow-hidden border-0 bg-white soft-shadow sm:min-h-[430px]">
            <AssetImage
              src="/assets/landing/hero-wireframe-mockup.png"
              alt="tryna 와이어프레임 목업"
              className="h-full min-h-[320px] object-contain p-4 sm:min-h-[430px] sm:p-8"
              fallback={
                <div className="flex min-h-[320px] flex-col items-center justify-center bg-white p-8 text-center sm:min-h-[430px]">
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <ImageIcon className="size-6" />
                  </div>
                  <p className="mt-5 text-xl font-semibold text-foreground">
                    와이어프레임 이미지 준비 중
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    직접 제작한 화면 시안이 들어갈 예정입니다.
                  </p>
                </div>
              }
            />
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
