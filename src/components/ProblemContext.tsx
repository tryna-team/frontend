import { CheckCircle2, Clock3, ListTodo, MessageSquareText } from "lucide-react"
import { motion } from "motion/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { problemCards } from "@/lib/constants"
import { fadeUp, staggerContainer } from "@/lib/motion"

const icons = [Clock3, MessageSquareText, CheckCircle2]

export default function ProblemContext() {
  return (
    <section id="problem" className="bg-[#F6F7F8] section-padding">
      <div className="section-shell grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeUp}
        >
          <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-normal text-foreground sm:text-3xl lg:text-4xl">
            일정은 캘린더에 있는데,
            <br />
            챙길 일은 자주 흩어집니다.
          </h2>
          <p className="mt-6 max-w-[540px] text-base leading-8 text-muted-foreground sm:text-lg">
            수업, 팀플, 병원, 약속처럼 일정은 캘린더에 적어두지만 그
            일정에 필요한 할 일이나 준비물은 메모, 카카오톡, 머릿속에 따로
            남는 경우가 많습니다.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={staggerContainer}
          className="grid gap-4"
        >
          <ProblemGraphic />
        </motion.div>
      </div>
    </section>
  )
}

function ProblemGraphic() {
  return (
    <motion.div variants={staggerContainer}>
      <Card className="overflow-hidden border-white bg-white/90 soft-shadow">
        <CardHeader className="border-b bg-[#fbfbfa]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                오늘
              </p>
              <CardTitle className="mt-1 text-xl">목요일의 흐름</CardTitle>
            </div>
            <div className="inline-flex size-11 items-center justify-center rounded-full bg-[#E9F4EF]">
              <ListTodo className="size-5 text-[#315947]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {problemCards.map((card, index) => {
            const Icon = icons[index] ?? CheckCircle2

            return (
              <motion.div
                key={card.title}
                variants={fadeUp}
                className="rounded-[20px] border bg-background p-4"
              >
                <div className="flex gap-3">
                  <div className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {card.body}
                    </CardDescription>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}
