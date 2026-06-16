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
    <section id="problem" className="bg-[#F7F8F7] section-padding">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeUp}
        >
          <h2 className="text-2xl font-semibold leading-tight tracking-normal text-foreground sm:text-3xl lg:text-4xl">
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
          className="min-w-0"
        >
          <ProblemGraphic />
        </motion.div>
      </div>
    </section>
  )
}

function ProblemGraphic() {
  return (
    <motion.div variants={staggerContainer} className="min-w-0">
      <Card className="overflow-hidden border-white bg-white/90 soft-shadow">
        <CardHeader className="border-b bg-[#FBFCFB] p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted-foreground">
                오늘
              </p>
              <CardTitle className="mt-1 text-lg sm:text-xl">
                목요일의 흐름
              </CardTitle>
            </div>
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EFFFF7] sm:size-11">
              <ListTodo className="size-5 text-[#16754D]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-5">
          {problemCards.map((card, index) => {
            const Icon = icons[index] ?? CheckCircle2

            return (
              <motion.div
                key={card.title}
                variants={fadeUp}
                className="min-w-0 rounded-[18px] border bg-background p-4 sm:rounded-[20px]"
              >
                <div className="grid min-w-0 grid-cols-[36px_1fr] gap-3">
                  <div className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Icon className="size-4 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="break-keep text-base leading-7">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="mt-2 break-keep">
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
