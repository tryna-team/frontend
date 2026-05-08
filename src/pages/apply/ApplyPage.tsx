import { ArrowRight } from "lucide-react"
import { motion } from "motion/react"
import { Link } from "react-router-dom"
import { jobPosts } from "@/lib/jobs"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { usePageMeta } from "@/lib/usePageMeta"

export default function ApplyPage() {
  const openPositionCount = jobPosts.length

  usePageMeta(
    "tryna - 지원",
    "일상 속에서 자연스럽게 쓰이는 캘린더를 함께 만들 사람을 찾고 있습니다.",
  )

  return (
    <section className="section-padding">
      <motion.div
        className="section-shell"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} className="max-w-[720px]">
          <p className="text-sm font-semibold text-[#4f6f62]">Apply</p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
            함께 만들 역할을 살펴보세요
          </h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            현재{" "}
            <span className="font-semibold text-sky-500">
              {openPositionCount}개
            </span>
            의 포지션이 열려있습니다.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-14 grid gap-4 lg:grid-cols-3"
        >
          {jobPosts.map((job) => (
            <motion.div key={job.id} variants={fadeUp}>
              <Link
                to={`/apply/${job.id}`}
                className="flex min-h-24 items-center justify-between gap-4 rounded-[22px] border bg-white p-6 text-foreground transition hover:-translate-y-1 hover:shadow-sm"
              >
                <span className="text-xl font-semibold tracking-normal">
                  {job.title}
                </span>
                <ArrowRight className="size-5 shrink-0" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
