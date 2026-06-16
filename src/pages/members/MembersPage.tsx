import { motion } from "motion/react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { fadeUp, staggerContainer } from "@/lib/motion"
import { usePageMeta } from "@/lib/usePageMeta"

const plannedSections = [
  "Members Hero",
  "Team Intro",
  "Member Grid Placeholder",
  "How We Collaborate",
]

export default function MembersPage() {
  usePageMeta(
    "tryna - 멤버소개",
    "tryna를 함께 만드는 사람들을 소개합니다.",
  )

  return (
    <section className="section-padding">
      <motion.div
        className="section-shell"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} className="max-w-[700px]">
          <p className="text-sm font-semibold text-[#16754D]">Members</p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
            멤버소개 페이지 준비 중
          </h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            tryna를 함께 만드는 사람들을 소개할 페이지입니다.
          </p>
          <Button asChild className="mt-8">
            <Link to="/apply">지원하기</Link>
          </Button>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {plannedSections.map((section) => (
            <motion.div key={section} variants={fadeUp}>
              <Card className="border bg-secondary/60 shadow-none">
                <CardContent className="p-6">
                  <div className="mb-8 h-2 w-12 rounded-full bg-border" />
                  <p className="text-sm font-medium text-foreground">
                    {section}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    콘텐츠 준비 중
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
