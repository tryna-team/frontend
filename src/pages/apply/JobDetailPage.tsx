import { ExternalLink } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { externalApplyLink, externalApplyLinkProps } from "@/lib/constants"
import { getJobPost } from "@/lib/jobs"
import { usePageMeta } from "@/lib/usePageMeta"

export default function JobDetailPage() {
  const { jobId } = useParams()
  const job = getJobPost(jobId)
  const isClosed = job?.status === "closed"
  const jobApplyLink = job?.applyLink || externalApplyLink
  const hasExternalApplyLink = !isClosed && Boolean(jobApplyLink)
  const jobApplyLinkProps =
    jobApplyLink.startsWith("http://") || jobApplyLink.startsWith("https://")
      ? { target: "_blank", rel: "noreferrer" }
      : externalApplyLinkProps

  usePageMeta(
    job ? `tryna - ${job.title}` : "tryna - 지원 역할을 찾을 수 없습니다",
    job?.description ??
      (job
        ? `${job.title} 지원 상세 페이지입니다.`
        : "요청한 지원 역할을 찾을 수 없습니다."),
  )

  if (!job) {
    return (
      <section className="section-padding">
        <div className="section-shell">
          <div className="max-w-[560px]">
            <p className="text-sm font-semibold text-[#16754D]">Apply</p>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
              지원 역할을 찾을 수 없습니다
            </h1>
            <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
              현재 열려 있는 역할 목록에서 다시 확인해 주세요.
            </p>
            <Button asChild className="mt-8">
              <Link to="/apply">지원 페이지로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding bg-background">
      <div className="section-shell">
        <div className="max-w-[760px]">
          {isClosed && (
            <Badge
              variant="outline"
              className="mb-5 border-slate-200 bg-slate-50 text-slate-500"
            >
              모집 종료
            </Badge>
          )}
          <h1 className="text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl">
            {job.title}
          </h1>
        </div>

        <div className="mt-12">
          <Separator />
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-20">
          <article className="min-w-0 space-y-20">
            <div>
              <p className="text-sm font-semibold text-[#16754D]">tryna</p>
              <div className="mt-5 border-l-4 border-[#C8FADF] pl-6">
                <p className="text-lg font-semibold leading-8 text-[#16754D]">
                  {job.description ?? "상세 내용은 아직 준비 중입니다."}
                </p>
                <ul className="mt-5 list-disc space-y-3 pl-5 text-base leading-8 text-muted-foreground">
                  {job.detail.introBullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {job.detail.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-foreground">
                  {section.title}
                </h2>
                <ul className="mt-5 list-disc space-y-3 pl-5 text-base leading-8 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </article>

          <aside className="lg:sticky lg:top-28">
            <div className="space-y-3">
              {hasExternalApplyLink ? (
                <Button
                  asChild
                  className="h-14 w-full rounded-[8px] bg-primary text-base font-semibold text-primary-foreground hover:bg-[#B6F4D5]"
                >
                  <a href={jobApplyLink} {...jobApplyLinkProps}>
                    지원하기
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              ) : (
                <Button
                  disabled
                  className="h-14 w-full rounded-[8px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary"
                >
                  {isClosed ? "모집 종료" : "지원 안내 준비 중"}
                </Button>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to="/apply">목록으로 돌아가기</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
