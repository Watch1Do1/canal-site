import { useEffect, useState, FormEvent } from "react";
import { APP_URL, API_BASE } from "./config";
import { LegalPageView } from "./pages/Legal";

type Tier = { index: number; from: number; to: number; price: number };
type Status = { open: boolean; spotsTaken: number; spotsLeft: number; currentTier: { index: number; price: number } | null; tiers: Tier[] };

const FALLBACK_TIERS: Tier[] = [
  { index: 1, from: 1, to: 25, price: 10 },
  { index: 2, from: 26, to: 50, price: 12.5 },
  { index: 3, from: 51, to: 75, price: 15 },
];
const money = (n: number) => `$${n % 1 ? n.toFixed(2) : n}`;

function Logo({ small = false }: { small?: boolean }) {
  return (
    <a href="/" className={`brand${small ? " sm" : ""}`} aria-label="Canal home">
      <img src="/canal-wordmark.svg" alt="Canal" width={small ? 92 : 112} height={small ? 27 : 33} />
      {!small && <span className="tag">Your AI. Your rules.</span>}
    </a>
  );
}

function Header() {
  return (
    <header className="top">
      <div className="wrap row">
        <Logo />
        <nav aria-label="Main">
          <a className="hide-sm" href="/#how">How it works</a>
          <a className="hide-sm" href="/#features">Features</a>
          <a className="hide-sm" href="/#pricing">Beta</a>
          <a className="btn small" href={APP_URL}>Sign in</a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="wrap row">
        <div className="foot-brand"><Logo small /><span>© {new Date().getFullYear()} Watch1Do1 LLC</span></div>
        <nav aria-label="Legal"><a href="/privacy">Privacy</a> <a href="/terms">Terms</a> <a href="/10dlc">What is 10DLC?</a> <a href={APP_URL}>Sign in</a></nav>
      </div>
    </footer>
  );
}

function useBetaStatus() {
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => {
    const ctl = new AbortController();
    fetch(`${API_BASE}/public/beta-status`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j && typeof j.spotsLeft === "number" && Array.isArray(j.tiers)) setS(j); })
      .catch(() => {});
    return () => ctl.abort();
  }, []);
  return s;
}

function Waitlist() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    try {
      const r = await fetch(`${API_BASE}/public/waitlist`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.get("name"), email: f.get("email"), website: f.get("website"), source: "site" }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) { setState("done"); return; }
      setMsg(j.error || "Something went wrong. Please try again."); setState("error");
    } catch { setMsg("Couldn't reach Canal. Please try again in a minute."); setState("error"); }
  }
  if (state === "done") return <p className="ok" role="status">You're on the list. We'll email you when your invite is ready.</p>;
  return (
    <form className="wl" onSubmit={submit} noValidate={false}>
      <label>Your name<input name="name" required maxLength={80} autoComplete="name" /></label>
      <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <div className="hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button className="btn" disabled={state === "sending"}>{state === "sending" ? "Joining…" : "Join the waitlist"}</button>
      {state === "error" && <p className="err" role="alert">{msg}</p>}
    </form>
  );
}

const FEATURES = [
  { icon: "👥", t: "Contact groups", d: "Sort people into Family, Work, VIP, or your own custom groups. Each group gets its own rules for what your AI may answer, book, or share." },
  { icon: "🛡️", t: "Spam and stranger screening", d: "Unknown senders follow your choice: a polite holding note, ask you first, or ignore. Daily limits and blocked topics are enforced by Canal." },
  { icon: "🤖", t: "Your own AI bot", d: "Connect the assistant you already use. Switch bots anytime and keep your number, email, contacts, and rules." },
  { icon: "💬", t: "Works by text and email", d: "One phone number and one email address for your assistant. Messages arrive in one place, screened the same way." },
];

function Home() {
  const status = useBetaStatus();
  const tiers = status?.tiers?.length ? status.tiers : FALLBACK_TIERS;
  return (
    <main id="main">
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">Private beta</p>
            <h1>You already have an AI. <span className="grad">Give it a number.</span></h1>
            <p className="lead">Canal gives your AI assistant its own phone number and email address. People text or email it like anyone else. Canal screens out the spam and the strangers, and your AI gets what matters.</p>
            <div className="cta"><a className="btn" href="#waitlist">Join the waitlist</a><a className="btn ghost" href="#how">See how it works</a></div>
            {status && (
              <p className="counter" role="status" aria-live="polite">
                {status.open && status.currentTier
                  ? <><strong>{status.spotsLeft}</strong> beta spot{status.spotsLeft === 1 ? "" : "s"} left at {money(status.currentTier.price)}</>
                  : <>Current beta spots are full. Join the waitlist for the next batch.</>}
              </p>
            )}
          </div>
          <div className="hero-card" aria-hidden="true">
            <img src="/icon-512.png" alt="" width={160} height={160} />
            <div className="bubble in">Hey, are you free Thursday?</div>
            <div className="bubble note">✓ Screened · Group: Work</div>
            <div className="bubble out">Passed to your AI</div>
          </div>
        </div>
      </section>

      <section id="how" className="wrap">
        <h2>How it works</h2>
        <ol className="steps">
          <li><h3>Pick your number and email</h3><p>Choose a phone number and an address for your assistant that belong to you, not to any one app.</p></li>
          <li><h3>Set your rules</h3><p>Put people in groups and decide who gets through. Spam and unknown senders are held or ignored, your choice.</p></li>
          <li><h3>Your AI gets what matters</h3><p>Screened messages go to your assistant. Replies are off by default; you turn them on when you're ready.</p></li>
        </ol>
      </section>

      <section id="features" className="wrap">
        <h2>Built for people who let AI do things</h2>
        <div className="features">
          {FEATURES.map((f) => (
            <div className="feature" key={f.t}><span className="ficon" aria-hidden="true">{f.icon}</span><h3>{f.t}</h3><p>{f.d}</p></div>
          ))}
        </div>
      </section>

      <section className="wrap band">
        <h2>Receive-only by default</h2>
        <p>Your assistant can read every screened text and email from day one. Letting it reply by text is your choice, and it starts once carrier registration is approved. <a href="/10dlc">What is 10DLC?</a></p>
      </section>

      <section className="wrap">
        <h2>Private by design</h2>
        <ul className="checks">
          <li>Canal briefly reads each message to screen it. That's how spam and stranger checks work, and we'd rather tell you plainly.</li>
          <li>Once your assistant receives a message, Canal erases the text.</li>
          <li>There's no admin screen that shows your messages.</li>
          <li>You can see the erasure counts yourself in your Settings.</li>
        </ul>
        <p><a href="/privacy">Read the privacy policy</a></p>
      </section>

      <section id="pricing" className="wrap band">
        <h2>Join the beta</h2>
        <p className="lead">$10 for 3 months, plus 3 invites that earn you future discounts, and you pick your number and email.</p>
        {status && (
          <p className="counter" role="status" aria-live="polite">
            {status.open && status.currentTier
              ? <><strong>{status.spotsLeft}</strong> spot{status.spotsLeft === 1 ? "" : "s"} left at {money(status.currentTier.price)}</>
              : <>Current beta spots are full. Join the waitlist for the next batch.</>}
          </p>
        )}
        <table className="tiers">
          <caption>Beta pricing for 3 months. Every tier keeps a lifetime discount; founding members get the biggest.</caption>
          <thead><tr><th scope="col">Members</th><th scope="col">Price</th></tr></thead>
          <tbody>{tiers.map((t) => (
            <tr key={t.index} className={status?.currentTier?.index === t.index ? "now" : ""}>
              <td>{t.from}–{t.to}{status?.currentTier?.index === t.index ? " (now)" : ""}</td><td>{money(t.price)}</td>
            </tr>))}</tbody>
        </table>
        <p className="small">Beta limits: incoming only until carrier approval, and up to 300 texts and 300 emails per month.</p>
      </section>

      <section id="waitlist" className="wrap">
        <div className="wl-card">
          <h2>Get on the waitlist</h2>
          <p>It's free. We send invites in batches as each tier opens.</p>
          <Waitlist />
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "");
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      {path === "/privacy" ? <LegalPageView page="privacy" /> : path === "/terms" ? <LegalPageView page="terms" /> : path === "/10dlc" || path === "/what-is-10dlc" ? <LegalPageView page="10dlc" /> : <Home />}
      <Footer />
    </>
  );
}
