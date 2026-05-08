import { useState } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AssetImageProps = {
  src: string
  alt: string
  className?: string
  fallback: ReactNode
}

export default function AssetImage({
  src,
  alt,
  className,
  fallback,
}: AssetImageProps) {
  const [isMissing, setIsMissing] = useState(false)

  if (isMissing) {
    return <>{fallback}</>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      onError={() => setIsMissing(true)}
      loading="lazy"
    />
  )
}
