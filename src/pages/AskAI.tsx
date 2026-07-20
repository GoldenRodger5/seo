import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowUp } from "lucide-react";
import Layout from "../components/Layout";
import { sites } from "../data/sites";

/**
 * Ask TwinkVault — free-text chat over the catalog.
 *
 * The guide answers site questions ("Helix vs Sean Cody?", "best under
 * $10?") in a natural voice and ends answers with internal links
 * (reviews, deals, compare). /api/chat holds the guardrails; links in
 * replies are server-whitelisted, and we still render them through a
 * strict parser here — model text never touches innerHTML.
 */

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "What's the best site under $10 a month?",
  "Helix Studios vs Sean Cody — which one?",
  "Biggest library for the money?",
  "Best bareback deal running right now?",
];

/** Render assistant text: markdown links → router Links (internal only), \n\n → paragraphs. */
const AssistantText = ({ text }: { text: string }) => (
  <>
    {text.split(/\n{2,}/).map((para, pi) => {
      const parts: React.ReactNode[] = [];
      let last = 0;
      const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(para)) !== null) {
        if (m.index > last) parts.push(para.slice(last, m.index));
        parts.push(
          <Link key={`${pi}-${m.index}`} to={m[2]} className="text-secondary font-medium hover:underline">
            {m[1]}
          </Link>
        );
        last = m.index + m[0].length;
      }
      if (last < para.length) parts.push(para.slice(last));
      return (
        <p key={pi} className="mb-2 last:mb-0 leading-relaxed">
          {parts}
        </p>
      );
    })}
  </>
);

const AskAI = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    setError("");
    setInput("");
    const nextMsgs: Msg[] = [...messages, { role: "user", content: message }];
    setMessages(nextMsgs);
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: nextMsgs.slice(-7, -1) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "error");
      setMessages((cur) => [...cur, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError((e as Error).message === "Request declined." ? "Can't help with that one." : "Something hiccuped — try that again.");
      setMessages((cur) => cur.slice(0, -1));
      setInput(message);
    }
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 60);
  };

  return (
    <Layout>
      <Helmet>
        <title>Ask TwinkVault — Gay Porn Site Questions, Answered</title>
        <meta
          name="description"
          content={`Ask anything about ${sites.length} reviewed gay membership sites: which one fits you, what things really cost, which deal is worth it. Real answers with links to the receipts.`}
        />
        <link rel="canonical" href="https://twinkvault.com/ask-ai" />
      </Helmet>

      <section className="py-12">
        <div className="container max-w-2xl">
          <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">
            Ask us anything
          </h1>
          <p className="mt-3 text-muted-foreground">
            We've reviewed and scored {sites.length} gay membership sites hands-on. Ask which one fits you,
            how two compare, or where the real deals are — answers come with links so you can check
            our work. Prefer multiple choice? <Link to="/find-my-site" className="text-secondary hover:underline">Take the 30-second quiz</Link>.
          </p>

          {/* Thread */}
          <div className="mt-8 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-button border border-border/60 bg-card/40 px-4 py-2 text-sm text-foreground/90 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg rounded-br-sm bg-primary/15 border border-primary/25 px-4 py-2.5 text-sm">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[92%] glass-card rounded-lg rounded-bl-sm px-4 py-3 text-sm text-foreground/90">
                    <AssistantText text={m.content} />
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="glass-card rounded-lg rounded-bl-sm px-4 py-3 text-sm text-muted-foreground">
                  thinking<span className="animate-pulse">…</span>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="mt-6 flex gap-2 sticky bottom-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={600}
              placeholder="e.g. Is TwinkTrade actually worth it?"
              aria-label="Ask a question about gay membership sites"
              className="min-w-0 flex-1 rounded-button border border-border/60 bg-background/90 px-4 py-3 text-sm outline-none focus:border-primary/60 shadow-lg"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="shrink-0 rounded-button gold-gradient px-4 py-3 text-secondary-foreground disabled:opacity-50"
            >
              <ArrowUp size={18} />
            </button>
          </form>

          <p className="mt-4 text-[11px] text-muted-foreground">
            18+. Answers cite our own reviews and live pricing; some links pay us a commission and
            never change a score. Site questions only — the guide won't do your homework.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default AskAI;
