import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Send, LifeBuoy } from 'lucide-react';
import { useAskZeroCarbon, type Answer } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/session';
import { errMsg } from '@/lib/zc';
import { formatFeeRate, pricing } from '@/lib/pricing';

type Turn = { q: string; a?: Answer; error?: string };

const SUGGEST = [
  'How does ZeroCarbon make money?',
  'What is the difference between removal and avoidance?',
  'What does a Future listing mean?',
  'How do I check my land?',
  'Is any of this real money?',
];
const REVENUE_ANSWER = `Checking land, listing credits and browsing are free. We earn from yearly plans for FPOs, project developers, companies and traders, from optional services that are quoted first, and from a ${formatFeeRate(pricing.deal_fee.standard_rate)} fee the seller pays when a voluntary deal completes. We never charge for government approval, registry fees or independent audits; those official fees are shown at actual cost. Demo: no payment is taken.`;

export function AskPanel({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { roleLabel } = useSession();
  const ask = useAskZeroCarbon();
  const [text, setText] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);

  const send = (q: string) => {
    const question = q.trim();
    if (!question) return;
    if (question.toLowerCase().replace(/[?.!]/g, '').trim() === 'how does zerocarbon make money') {
      setText('');
      setTurns((t) => [...t, { q: question, a: { answer: REVENUE_ANSWER, see_screen: '/pricing', escalate: false, available: true } }]);
      return;
    }
    if (ask.isPending) return;
    setText('');
    setTurns((t) => [...t, { q: question }]);
    ask.mutate(
      { data: { question, screen: location, role: roleLabel } },
      {
        onSuccess: (a) => setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a } : x))),
        onError: (e) => setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, error: errMsg(e) } : x))),
      },
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {turns.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Plain answers about labels, buying, land checks and orders. No advice on money.</p>
            <div className="flex flex-col gap-2">
              {SUGGEST.map((s) => (
                <button key={s} onClick={() => send(s)} className="tap rounded-xl border bg-card px-3 py-2 text-left text-sm hover:border-[hsl(var(--forest))]" data-testid="button-ask-suggestion">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[hsl(var(--forest))] px-3 py-2 text-sm text-[hsl(var(--paper))]">{t.q}</div>
            {!t.a && !t.error && (
              <div className="flex w-fit gap-1 rounded-2xl bg-card px-4 py-3 border">
                {[0, 1, 2].map((d) => <span key={d} className="pulse-dot h-1.5 w-1.5 rounded-full bg-[hsl(var(--forest))]" style={{ animationDelay: `${d * 0.2}s` }} />)}
              </div>
            )}
            {t.error && <div className="w-fit max-w-[90%] rounded-2xl border border-destructive/30 bg-card px-3 py-2 text-sm">{t.error}</div>}
            {t.a && (
              <div className="w-fit max-w-[92%] space-y-2 rounded-2xl rounded-bl-sm border bg-card px-3 py-2 text-sm" data-testid="text-ask-answer">
                {!t.a.available && <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(30_65%_32%)]">Assistant unavailable</p>}
                <p className="whitespace-pre-wrap">{t.a.answer}</p>
                {t.a.see_screen && (
                  <Link href={t.a.see_screen} onClick={onNavigate} className="tap inline-flex items-center gap-1 font-semibold text-[hsl(var(--forest))]" data-testid="link-see-screen">
                    Open {t.a.see_screen} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {t.a.escalate && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><LifeBuoy className="h-3.5 w-3.5" /> Passed to the ZeroCarbon team.</p>}
              </div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-end gap-2 border-t pt-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text); } }}
          placeholder="Ask anything about this market"
          rows={1}
          maxLength={2000}
          className="min-h-[44px] resize-none bg-card"
          data-testid="input-ask"
        />
        <Button type="submit" size="icon" className="tap h-11 w-11 shrink-0" disabled={!text.trim() || ask.isPending} data-testid="button-ask-send" aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
