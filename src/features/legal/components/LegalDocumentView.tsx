import { useEffect, useRef } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import privacyDetail from '@/features/legal/content/detail/privacy-policy.ko.md?raw';
import termsDetail from '@/features/legal/content/detail/terms-of-use.ko.md?raw';
import privacySummary from '@/features/legal/content/summary/privacy-policy.ko.md?raw';
import termsSummary from '@/features/legal/content/summary/terms-of-use.ko.md?raw';
import {
  LEGAL_DOCUMENT_TITLE,
  type LegalDocumentType,
  type LegalDocumentVariant,
} from '@/features/legal/legalDocument';
import { cn } from '@/lib/utils';

const LEGAL_DOCUMENT_CONTENT: Record<
  LegalDocumentVariant,
  Record<LegalDocumentType, string>
> = {
  detail: {
    terms: termsDetail,
    privacy: privacyDetail,
  },
  summary: {
    terms: termsSummary,
    privacy: privacySummary,
  },
};

type LegalDocumentViewProps = {
  document: LegalDocumentType;
  variant: LegalDocumentVariant;
  layout?: 'sheet' | 'page';
  className?: string;
};

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mb-7 text-[30px] leading-[1.35] font-bold tracking-[-0.03em] max-[480px]:text-[25px]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-9 mb-3.5 text-[19px] leading-[1.45] font-bold tracking-[-0.02em] max-[480px]:mt-8 max-[480px]:text-lg">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6.5 mb-2.5 text-base leading-normal font-bold tracking-[-0.015em]">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3.5 text-[15px] leading-[1.75] font-[450] tracking-[-0.012em] last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="font-semibold text-purple-600 underline decoration-1 underline-offset-[3px]"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-3.5 mb-4.5 list-disc pl-6 marker:font-bold marker:text-purple-400">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3.5 mb-4.5 list-decimal pl-6 marker:font-bold marker:text-purple-400">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-0.5 text-[15px] leading-[1.7] font-[450] tracking-[-0.012em] [&+li]:mt-[7px] [&>p]:m-0">
      {children}
    </li>
  ),
  hr: () => <hr className="my-[30px] h-px border-0 bg-divider-default" />,
  blockquote: ({ children }) => (
    <blockquote className="my-5 rounded-r-xl border-l-[3px] border-purple-300 bg-purple-50 px-4 py-3.5 text-text-additional [&>p]:m-0">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-[5px] bg-grey-opacity-100 px-[5px] py-0.5 font-inherit text-[0.9em]">
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div
      className="my-[18px] mb-6 w-full overflow-x-auto rounded-[14px] border border-grey-opacity-100 bg-background-white shadow-[0_6px_20px_rgb(28_22_48_/_6%)] max-[480px]:rounded-xl"
      tabIndex={0}
    >
      <table className="w-full table-fixed border-separate border-spacing-0">{children}</table>
    </div>
  ),
  tr: ({ children }) => (
    <tr className="[&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-grey-opacity-100">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="border-b border-grey-opacity-100 bg-grey-opacity-100 px-3.5 py-3 text-left align-top text-[13px] leading-[1.55] font-bold tracking-[-0.01em] text-text-additional first:w-[32%] max-[480px]:px-[11px] max-[480px]:py-2.5 max-[480px]:text-[12.5px] max-[480px]:first:w-[34%]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3.5 py-3 text-left align-top text-[13px] leading-[1.55] tracking-[-0.01em] break-words first:w-[32%] first:min-w-[108px] first:bg-grey-opacity-50 first:font-semibold max-[480px]:px-[11px] max-[480px]:py-2.5 max-[480px]:text-[12.5px] max-[480px]:first:w-[34%] max-[480px]:first:min-w-24">
      {children}
    </td>
  ),
};

export default function LegalDocumentView({
  document,
  variant,
  layout = 'sheet',
  className,
}: LegalDocumentViewProps) {
  const articleRef = useRef<HTMLElement>(null);
  const content = LEGAL_DOCUMENT_CONTENT[variant][document];
  // 시트는 헤더가 제목을 제공하므로 Markdown의 첫 번째 h1을 중복 노출하지 않는다.
  const body = layout === 'sheet' ? content.replace(/^# .+\n+/, '') : content;

  useEffect(() => {
    articleRef.current?.scrollTo({ top: 0 });
  }, [document, variant]);

  return (
    <article
      ref={articleRef}
      aria-label={LEGAL_DOCUMENT_TITLE[document]}
      className={cn(
        "font-['Pretendard_Variable',sans-serif] text-text-default [overflow-wrap:anywhere] [word-break:keep-all]",
        layout === 'sheet' &&
          'min-h-0 w-full flex-1 overflow-y-auto overscroll-contain px-1 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        layout === 'page' && 'w-full',
        variant === 'detail' &&
          '[&>p:first-of-type]:mb-5 [&>p:first-of-type]:inline-flex [&>p:first-of-type]:rounded-full [&>p:first-of-type]:bg-grey-opacity-100 [&>p:first-of-type]:px-2.5 [&>p:first-of-type]:py-[5px] [&>p:first-of-type]:text-xs [&>p:first-of-type]:leading-normal [&>p:first-of-type]:font-semibold [&>p:first-of-type]:text-text-additional',
        variant === 'summary' &&
          '[&>p:first-of-type]:mb-6 [&>p:first-of-type]:leading-[1.75] [&>p:first-of-type]:text-text-additional',
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {body}
      </Markdown>
    </article>
  );
}
