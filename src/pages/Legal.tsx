import { privacyHtml, termsHtml, tenDlcHtml } from "./legalContent";

const pages = { privacy: privacyHtml, terms: termsHtml, "10dlc": tenDlcHtml } as const;
export type LegalPage = keyof typeof pages;

export function LegalPageView({ page }: { page: LegalPage }) {
  return (
    <main id="main" className="wrap legal">
      <article className="legal-body" dangerouslySetInnerHTML={{ __html: pages[page] }} />
      <p><a href="/">← Back to home</a></p>
    </main>
  );
}
