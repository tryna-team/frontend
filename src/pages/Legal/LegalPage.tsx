import { useEffect } from 'react';
import { Link } from 'react-router';

import LegalDocumentView from '@/features/legal/components/LegalDocumentView';
import {
  LEGAL_DOCUMENT_TITLE,
  type LegalDocumentType,
} from '@/features/legal/legalDocument';
import { PATH } from '@/routes/paths';

type LegalPageProps = {
  document: LegalDocumentType;
};

export default function LegalPage({ document }: LegalPageProps) {
  const title = LEGAL_DOCUMENT_TITLE[document];

  useEffect(() => {
    const previousTitle = window.document.title;
    window.document.title = `${title} | tryna`;

    return () => {
      window.document.title = previousTitle;
    };
  }, [title]);

  return (
    <div className="min-h-[100dvh] bg-background-white">
      <main className="mx-auto flex w-full max-w-[760px] flex-col px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to={PATH.HOME}
          className="mb-8 w-fit default-body-strong-medium text-text-additional hover:text-text-default"
        >
          ← tryna로 돌아가기
        </Link>

        <LegalDocumentView document={document} variant="detail" layout="page" />
      </main>
    </div>
  );
}
