export type LegalDocumentType = 'terms' | 'privacy';
export type LegalDocumentVariant = 'detail' | 'summary';

export const LEGAL_DOCUMENT_TITLE: Record<LegalDocumentType, string> = {
  terms: '서비스 이용약관',
  privacy: '개인정보 처리방침',
};
