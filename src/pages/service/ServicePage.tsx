import Hero from "@/components/Hero"
import LifestyleRail from "@/components/LifestyleRail"
import ProblemContext from "@/components/ProblemContext"
import ProductPreview from "@/components/ProductPreview"
import RecruitingBanner from "@/components/RecruitingBanner"
import ServiceDirection from "@/components/ServiceDirection"
import { usePageMeta } from "@/lib/usePageMeta"

export default function ServicePage() {
  usePageMeta(
    "트라이나 - tryna Calendar",
    "일상의 작은 것들을 놓치지 않도록",
  )

  return (
    <>
      <Hero />
      <LifestyleRail />
      <ProblemContext />
      <ServiceDirection />
      <ProductPreview />
      <RecruitingBanner />
    </>
  )
}
