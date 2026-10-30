export function LegalDraft({ title }: { title: string }) {
  return (
    <main id="main" className="wrap legal">
      <p className="draft" role="note"><strong>Draft.</strong> This page is a placeholder pending legal review (Mark). It is not yet our official {title.toLowerCase()}.</p>
      <h1>{title}</h1>
      {title === "Privacy" ? (
        <>
          <p>In short: Canal briefly reads each message to screen it, then erases the text after your assistant receives it. We keep basic records (who, when, how many) for billing and abuse prevention. There is no admin screen that shows message content.</p>
          <p>The full policy, including exact retention periods and how our carriers (Twilio) and email provider (Resend) handle copies, is coming soon.</p>
        </>
      ) : (
        <p>Our terms of service are being finalized. During the beta, Canal is receive-only until carrier approval, with limits of 300 texts and 300 emails per month.</p>
      )}
      <p><a href="/">← Back to home</a></p>
    </main>
  );
}
