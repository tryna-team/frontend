import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { usePageMeta } from "@/lib/usePageMeta"

export default function NotFoundPage() {
  usePageMeta(
    "tryna - 페이지를 찾을 수 없습니다",
    "요청한 tryna 페이지를 찾을 수 없습니다.",
  )

  return (
    <section className="section-padding">
      <div className="section-shell">
        <div className="max-w-[560px]">
          <p className="text-sm font-semibold text-[#16754D]">404</p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            요청한 주소가 없거나 이동되었을 수 있습니다.
          </p>
          <Button asChild className="mt-8">
            <Link to="/service">서비스 소개로 돌아가기</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
