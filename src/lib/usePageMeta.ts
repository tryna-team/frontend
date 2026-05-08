import { useEffect } from "react"

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title

    const metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )

    if (metaDescription) {
      metaDescription.content = description
    }
  }, [description, title])
}
