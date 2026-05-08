import { ArrowRight, ImageIcon } from "lucide-react"
import { motion } from "motion/react"
import { Link } from "react-router-dom"
import AssetImage from "@/components/AssetImage"
import { Button } from "@/components/ui/button"
import { fadeUp } from "@/lib/motion"

export default function RecruitingBanner() {
  return (
    <section id="recruiting" className="bg-background py-10 sm:py-14">
      <motion.div
        className="relative min-h-[420px] overflow-hidden bg-[#dfe7e3]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={fadeUp}
      >
        <AssetImage
          src="/assets/landing/recruiting-banner.png"
          alt="tryna를 함께 만드는 팀 이미지"
          className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
          fallback={
            <div className="absolute inset-0 flex items-end justify-end bg-[#dfe7e3] p-8 text-[#1f2933]">
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-white/70">
                <ImageIcon className="size-6" />
              </div>
            </div>
          }
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#eef3f2]/95 via-[#eef3f2]/78 to-transparent" />
        <div className="section-shell relative z-10 flex min-h-[420px] items-center">
          <div className="max-w-[560px] py-14">
            <h2 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
              일상 속에서 자연스럽게 쓰이는 캘린더를 함께 만들 사람을 찾고
              있습니다.
            </h2>
            <p className="mt-6 max-w-[520px] text-base leading-8 text-foreground/80 sm:text-lg">
              tryna가 추구하는 가치와 방향에 공감하신다면 지원하세요.
            </p>
            <motion.div
              className="mt-10 inline-flex"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                asChild
                size="lg"
                className="h-14 rounded-[6px] bg-[#3d464b] px-10 text-base text-white shadow-lg shadow-black/15 hover:bg-[#313a3f]"
              >
                <Link to="/apply">
                  지원 바로가기
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
