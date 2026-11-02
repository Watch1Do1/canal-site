import { useEffect, useRef, useState, type FormEvent } from "react";
import { API_BASE } from "../config";
import { TURNSTILE_SITE_KEY, loadTurnstile } from "../turnstile";

type Status = "waiting" | "signed_in" | "connected" | "expired";

const STEPS: { name: string; steps: string[] }[] = [
  { name: "Claude (claude.ai or the Claude desktop app)", steps: [
    "Open Settings, then Connectors, and choose Add custom connector.",
    "Name it Canal test and paste the test address below as the URL. Leave the advanced fields empty. Click Add.",
    "Click Connect. A Canal page opens: type your test code and click Connect.",
    "Back in a chat, turn the Canal test connector on and ask: \"Use the canal_ping tool.\"",
  ] },
  { name: "ChatGPT", steps: [
    "Open Settings, then Apps & Connectors, then Advanced settings, and turn on Developer mode.",
    "Choose Create. Name it Canal test, paste the test address as the MCP server URL, and pick OAuth for authentication. Leave the client fields empty. Click Create.",
    "When the Canal page opens, type your test code and click Connect.",
    "In a new chat, pick Developer mode, add the Canal test connector, and ask: \"Call canal_ping.\"",
  ] },
  { name: "Cursor", steps: [
    "Open Cursor Settings, then Tools & MCP, and choose New MCP Server.",
    "Add a server named canal-test with the test address as its url, then save.",
    "Click Connect (or Needs login) next to canal-test. When the Canal page opens, type your test code and click Connect.",
    "In an Agent chat, ask: \"Call the canal_ping tool.\"",
  ] },
  { name: "Another AI app", steps: [
    "Look for a setting to add a remote MCP server (sometimes called a connector or custom tool) that signs in with OAuth.",
    "Paste the test address, start the sign-in, and type your test code on the Canal page.",
    "Ask your AI to call the canal_ping tool.",
    "If your app has no such setting, or only takes a fixed API key, this test can't pass yet.",
  ] },
];

const AI_OPTIONS: [string, string][] = [
  ["claude", "Claude"], ["chatgpt", "ChatGPT"], ["cursor", "Cursor"],
  ["vscode_copilot", "VS Code Copilot"], ["grok", "Grok"], ["other", "Other"],
];
const STEP_OPTIONS: [string, string][] = [
  ["add_url", "Adding the URL"], ["sign_in", "Sign-in"], ["tool_call", "Tool call"], ["other", "Other"],
];

function ReportForm({ testCode }: { testCode: string }) {
  const [open, setOpen] = useState(false);
  const [ai, setAi] = useState("");
  const [aiOther, setAiOther] = useState("");
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState("");
  const [checkFailed, setCheckFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!open || done) return;
    let cancelled = false;
    loadTurnstile().then(() => {
      if (cancelled || !boxRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(boxRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => { setToken(t); setCheckFailed(false); },
        "expired-callback": () => setToken(""),
        "error-callback": () => { setToken(""); setCheckFailed(true); },
      });
    }).catch(() => { if (!cancelled) setCheckFailed(true); });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [open, done]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!ai) { setErr("Please choose which AI or app you tried."); return; }
    if (ai === "other" && !aiOther.trim()) { setErr("Please tell us which AI or app you tried."); return; }
    if (!step) { setErr("Please choose where it stopped working."); return; }
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/public/compat-report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai, aiOther: ai === "other" ? aiOther : "", step, error, email, testCode, website, turnstileToken: token }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(j.error || "Something went wrong. Please try again.");
        setToken("");
        if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
        return;
      }
      setDone(true);
    } catch { setErr("Couldn't reach Canal. Please try again in a minute."); }
    finally { setBusy(false); }
  }

  if (done) return <div className="wl-card" role="status"><p>Thanks, we got it. We'll use this to improve compatibility.</p></div>;
  if (!open) return <p><button className="btn ghost small-btn" onClick={() => setOpen(true)}>Didn't work? Tell us</button></p>;
  return (
    <form className="wl-card report-form" onSubmit={submit}>
      <h2>Didn't work? Tell us</h2>
      <label>Which AI or app did you try?
        <select value={ai} onChange={(e) => setAi(e.target.value)} required>
          <option value="">Choose one</option>
          {AI_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      {ai === "other" && <label>Which one?
        <input type="text" value={aiOther} maxLength={80} onChange={(e) => setAiOther(e.target.value)} required />
      </label>}
      <label>Where did it stop working?
        <select value={step} onChange={(e) => setStep(e.target.value)} required>
          <option value="">Choose one</option>
          {STEP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label>Error message (optional)
        <textarea value={error} maxLength={500} rows={3} onChange={(e) => setError(e.target.value)} />
      </label>
      <label>Email, if you'd like us to follow up (optional)
        <input type="email" value={email} maxLength={254} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
      </label>
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      <div ref={boxRef} className="ts" />
      {checkFailed && <p className="err" role="alert">The human check didn't load. Please refresh the page and try again.</p>}
      <button className="btn" type="submit" disabled={busy || !token}>{busy ? "Sending…" : token ? "Send report" : "Complete the check above"}</button>
      {err && <p className="err" role="alert">{err}</p>}
    </form>
  );
}

export function TestYourAi() {
  const [token, setToken] = useState("");
  const [checkFailed, setCheckFailed] = useState(false);
  const [code, setCode] = useState("");
  const [mcpUrl, setMcpUrl] = useState("https://app.getcanal.app/mcp-test");
  const [status, setStatus] = useState<Status>("waiting");
  const [clientName, setClientName] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (code) return;
    let cancelled = false;
    loadTurnstile().then(() => {
      if (cancelled || !boxRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(boxRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => { setToken(t); setCheckFailed(false); },
        "expired-callback": () => setToken(""),
        "error-callback": () => { setToken(""); setCheckFailed(true); },
      });
    }).catch(() => { if (!cancelled) setCheckFailed(true); });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [code]);

  useEffect(() => {
    if (!code || status === "connected" || status === "expired") return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/public/ai-test/status?code=${encodeURIComponent(code)}`);
        if (!r.ok) return;
        const j = await r.json();
        if (j.status) setStatus(j.status);
        if (j.clientName) setClientName(j.clientName);
      } catch { /* keep polling; a dropped poll is retried in 3 s */ }
    }, 3000);
    return () => clearInterval(t);
  }, [code, status]);

  async function start() {
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${API_BASE}/public/ai-test/code`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ turnstileToken: token }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(j.error || "Something went wrong. Please try again.");
        setToken("");
        if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
        return;
      }
      setCode(j.code); if (j.mcpUrl) setMcpUrl(j.mcpUrl); setStatus("waiting"); setClientName(null);
    } catch { setErr("Couldn't reach Canal. Please try again in a minute."); }
    finally { setBusy(false); }
  }

  function copy(text: string, what: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(""), 1500); }, () => setCopied(""));
  }

  return (
    <main id="main" className="wrap test-ai">
      <h1>Test your AI with Canal</h1>
      <p className="lead">Before you sign up, check that your AI app can connect to Canal. The test uses the same sign-in steps as a real connection, with a test server that has no messages or accounts in it.</p>

      {!code ? (
        <>
        <div className="wl-card">
          <h2>1. Get a test code</h2>
          <div ref={boxRef} className="ts" />
          {checkFailed && <p className="err" role="alert">The human check didn't load. Please refresh the page and try again.</p>}
          <button className="btn" disabled={busy || !token} onClick={start}>{busy ? "Getting a code…" : token ? "Get my test code" : "Complete the check above"}</button>
          {err && <p className="err" role="alert">{err}</p>}
        </div>
        {err && <ReportForm testCode="" />}
        </>
      ) : (
        <>
          <div className={`wl-card test-status ${status}`} role="status" aria-live="polite">
            {status === "connected" ? (
              <><h2>✅ Passed</h2><p>{clientName ? <><b>{clientName}</b> connected</> : "Your AI connected"}, signed in, and called Canal. A real Canal connection from this app uses the same steps.</p></>
            ) : status === "signed_in" ? (
              <><h2>Almost there</h2><p>{clientName ? <><b>{clientName}</b> signed in.</> : "Your AI signed in."} Now ask it to call the canal_ping tool.</p></>
            ) : status === "expired" ? (
              <><h2>Code expired</h2><p>Test codes last 15 minutes. <a href="/test-your-ai">Get a new one</a>.</p></>
            ) : (
              <><h2>Waiting for your AI…</h2><p>Follow the steps below. This box turns green when your AI connects.</p></>
            )}
          </div>
          <div className="wl-card">
            <p>Test address: <code>{mcpUrl}</code> <button className="btn ghost small-btn" onClick={() => copy(mcpUrl, "url")}>{copied === "url" ? "Copied" : "Copy"}</button></p>
            <p>Test code: <code className="big-code">{code}</code> <button className="btn ghost small-btn" onClick={() => copy(code, "code")}>{copied === "code" ? "Copied" : "Copy"}</button></p>
            <p className="small">The code works for 15 minutes. Remove the Canal test connector from your AI app when you're done.</p>
          </div>
          {status !== "connected" && <ReportForm testCode={code} />}
        </>
      )}

      <h2>2. Connect your AI</h2>
      {STEPS.map((c) => (
        <details key={c.name} className="test-steps">
          <summary>{c.name}</summary>
          <ol>{c.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </details>
      ))}
      <p className="small">App menus change often. If a step doesn't match what you see, look for the setting to add a custom MCP connector. Some AI apps only offer custom connectors on paid plans.</p>
      <p><a href="/#waitlist">← Back to the waitlist</a></p>
    </main>
  );
}
