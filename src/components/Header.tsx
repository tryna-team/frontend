import { Menu } from "lucide-react"
import { Link, NavLink } from "react-router-dom"
import { navItems } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-base font-semibold transition hover:text-foreground",
    isActive ? "text-foreground" : "text-muted-foreground",
  )

const mobileNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-2xl px-4 py-3 text-lg font-semibold transition hover:bg-secondary",
    isActive ? "bg-secondary text-foreground" : "text-foreground",
  )

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-white/80 backdrop-blur-xl">
      <div className="section-shell flex h-20 items-center justify-between">
        <Link
          to="/service"
          className="inline-flex items-center"
          aria-label="tryna 홈으로 이동"
        >
          <img
            src="/assets/logo/logo_primary_light.svg"
            alt="tryna"
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-16 md:flex" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={navLinkClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="메뉴 열기">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  <img
                    src="/assets/logo/logo_primary_light.svg"
                    alt="tryna"
                    className="h-8 w-auto"
                  />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-10 flex flex-col gap-2" aria-label="모바일 메뉴">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.path}>
                    <NavLink to={item.path} className={mobileNavLinkClassName}>
                      {item.label}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
