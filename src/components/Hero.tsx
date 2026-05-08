import { motion } from "motion/react"
import { fadeUp, softReveal } from "@/lib/motion"

export default function Hero() {
  return (
    <section id="top" className="overflow-hidden pt-18 sm:pt-20 lg:pt-28">
      <div className="section-shell">
        <motion.div
          className="max-w-[720px]"
          initial="hidden"
          animate="visible"
          variants={softReveal}
        >
          <h1 className="text-[clamp(2.05rem,5.4vw,3.3rem)] font-semibold leading-[1.12] tracking-normal text-foreground">
            일상의 작은 것들을 놓치지 않도록
            <br />
            
          </h1>
          <p className="mt-6 max-w-[900px] text-base leading-8 text-muted-foreground sm:text-xl">
            해야 할 일을 놓치지 않고,
            <br />
            하루를 자연스럽게 살아가는 것.
          </p>
          <p className="mt-6 max-w-[900px] text-base leading-8 text-muted-foreground sm:text-xl">
            tryna는 하루의 일정과 해야 할 것들,
            <br />
            그리고 그 옆에 필요한 작은 챙길 것들을 함께 두어
            <br />
            각자의 하루가 더 자연스럽게 이어지도록 돕습니다.
          </p>
        </motion.div>

        <motion.div
          className="mt-20 h-px w-full bg-border"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        />
      </div>
    </section>
  )
}
