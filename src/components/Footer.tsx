import { Camera, Code2, Mail } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const footerLinks = [
  { label: "Instagram", href: "https://www.instagram.com/tryna.studio/", icon: Camera },
  { label: "GitHub", href: "", icon: Code2 },
  { label: "Contact", href: "mailto:tryingtotryna@gmail.com", icon: Mail },
]

export default function Footer() {
  return (
    <footer className="bg-background pb-10 pt-8">
      <div className="section-shell">
        <Separator />
        <div className="flex flex-col gap-8 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">tryna</p>
            <p className="mt-3 max-w-[420px] text-sm leading-6 text-muted-foreground">
              일상의 작은 것들을 놓치지 않도록
              <br />
              tryna Calendar.
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              © 2026 tryna. All rights reserved.
            </p>
          </div>
          <div className="flex gap-2">
            {footerLinks.map((link) => {
              const Icon = link.icon

              return (
                <a
                  key={link.label}
                  href={link.href}
                  className="inline-flex size-10 items-center justify-center rounded-full border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  aria-label={link.label}
                >
                  <Icon className="size-4" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
