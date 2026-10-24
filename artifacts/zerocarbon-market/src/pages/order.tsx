import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Check, FileCheck2, Send, LifeBuoy } from 'lucide-react';
import { useGetOrder, getGetOrderQueryKey, useAskOrder, type Answer } from '@workspace/api-client-react';
import { Page } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ErrorState, NoMoneyNote, PageSkeleton } from '@/components/zc/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errMsg, fmtDate, inr, num } from '@/lib/zc';
import { cn } from '@/lib/utils';

export default function OrderPage() {
  const { id = '' } = useParams<{ id: string }>();
  const q = useGetOrder(id, {
    query: {
      queryKey: getGetOrderQueryKey(id),
      enabled: !!id,
      refetchInterval: (query) => {
        const o = query.state.data;
        return o && o.stages.length && o.stages_done.length >= o.stages.length ? false : 2500;
      },
    },
  });
  const ask = useAskOrder();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [askErr, setAskErr] = useState('');

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAskErr('');
    ask.mutate({ id, data: { question: question.trim(), screen: `/orders/${id}` } }, {
      onSuccess: (a) => { setAnswer(a); setQuestion(''); },
      onError: (er) => setAskErr(errMsg(er)),
    });
  };

  return (
    <Page className="max-w-2xl">
      <Link href="/orders" className="tap -ml-2 inline-flex items-center gap-1 px-2 text-sm text-muted-foreground" data-testid="link-back-orders"><ArrowLeft className="h-4 w-4" /> Orders</Link>
      {q.isLoading ? <PageSkeleton /> : q.isError || !q.data ? <ErrorState message={errMsg(q.error, 'Order not found.')} onRetry={() => q.refetch()} /> : (() => {
        const o = q.data;
        const done = new Set(o.stages_done);
        const ready = o.stages.length > 0 && o.stages_done.length >= o.stages.length;
        const currentIdx = o.stages.findIndex((s) => !done.has(s));
        return (
          <div className="space-y-6">
            <div className="rise">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground" data-testid="text-order-id">Order {o.id.slice(0, 8)}</span>
                <DemoChip />
              </div>
              <h1 className="mt-1 font-display text-2xl font-semibold md:text-3xl">{o.listing.project_name}</h1>
              <p className="text-sm text-muted-foreground">{num(o.quantity_t)} t at {inr(o.price_inr_per_t)} / t · demo total {inr(o.quantity_t * o.price_inr_per_t)} · {o.route} route · {fmtDate(o.created_at)}</p>
            </div>

            <ol className="relative rounded-2xl border bg-card p-5" data-testid="list-stages">
              {o.stages.map((s, i) => {
                const isDone = done.has(s);
                const isCurrent = i === currentIdx;
                return (
                  <li key={s} className="relative flex gap-4 pb-6 last:pb-0" data-testid={`stage-${i}`}>
                    {i < o.stages.length - 1 && <span className={cn('absolute left-[15px] top-8 h-[calc(100%-24px)] w-0.5', isDone ? 'bg-[hsl(var(--leaf))]' : 'bg-border')} />}
                    <span className={cn('relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500',
                      isDone ? 'border-[hsl(var(--leaf))] bg-[hsl(var(--leaf))] text-white' : isCurrent ? 'border-[hsl(var(--marigold))] bg-card' : 'border-border bg-card')}>
                      {isDone ? <Check className="h-4 w-4" /> : isCurrent ? <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-[hsl(var(--marigold))]" /> : <span className="text-xs text-muted-foreground">{i + 1}</span>}
                    </span>
                    <div className="pt-1">
                      <div className={cn('font-medium', !isDone && !isCurrent && 'text-muted-foreground')}>{s}</div>
                      {isCurrent && <div className="text-xs text-muted-foreground">In progress (simulated)</div>}
                    </div>
                  </li>
                );
              })}
            </ol>

            {ready ? (
              <Link href={`/certificates/${o.certificate_token}`} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--forest))] font-semibold text-[hsl(var(--paper))] rise" data-testid="link-certificate">
                <FileCheck2 className="h-5 w-5" /> Open demo certificate
              </Link>
            ) : (
              <div className="flex h-14 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground" data-testid="text-certificate-pending">Certificate appears when every stage is done</div>
            )}

            <div className="rounded-xl bg-secondary p-4 text-sm"><div className="text-xs text-muted-foreground">Wording on this order</div><p className="mt-1">{o.claim_text}</p></div>

            <section className="rounded-2xl border bg-card p-4">
              <h2 className="font-semibold">Question about this order?</h2>
              <form onSubmit={send} className="mt-3 flex gap-2">
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={2000} placeholder="When will my certificate be ready?" className="h-11 bg-background" data-testid="input-order-question" />
                <Button type="submit" size="icon" className="tap h-11 w-11 shrink-0" disabled={!question.trim() || ask.isPending} aria-label="Send" data-testid="button-order-question"><Send className="h-4 w-4" /></Button>
              </form>
              {ask.isPending && <p className="mt-3 text-sm text-muted-foreground">Asking...</p>}
              {askErr && <p className="mt-3 text-sm text-destructive">{askErr}</p>}
              {answer && (
                <div className="mt-3 space-y-2 rounded-xl bg-background p-3 text-sm" data-testid="text-order-answer">
                  <p className="whitespace-pre-wrap">{answer.answer}</p>
                  {answer.see_screen && <Link href={answer.see_screen} className="tap inline-flex items-center font-semibold text-[hsl(var(--forest))]">Open {answer.see_screen}</Link>}
                  {answer.escalate && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><LifeBuoy className="h-3.5 w-3.5" /> Sent to the ZeroCarbon team.</p>}
                </div>
              )}
            </section>
            <NoMoneyNote />
          </div>
        );
      })()}
    </Page>
  );
}
