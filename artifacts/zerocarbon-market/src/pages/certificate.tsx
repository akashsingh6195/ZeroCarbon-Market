import { useState } from 'react';
import { useParams } from 'wouter';
import { Share2, Check, Printer } from 'lucide-react';
import { useGetCertificate, getGetCertificateQueryKey } from '@workspace/api-client-react';
import { Page, Logo } from '@/components/zc/layout';
import { DemoChip } from '@/components/zc/demo-chip';
import { ErrorState, PageSkeleton } from '@/components/zc/states';
import { Button } from '@/components/ui/button';
import { errMsg, errStatus, fmtDate, num } from '@/lib/zc';

export default function CertificatePage() {
  const { token = '' } = useParams<{ token: string }>();
  const q = useGetCertificate(token, {
    query: {
      queryKey: getGetCertificateQueryKey(token),
      enabled: !!token,
      retry: false,
      refetchInterval: (query) => (query.state.error && [404, 409, 425].includes(errStatus(query.state.error) ?? 0) ? 3000 : false),
    },
  });
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'ZeroCarbon demo certificate', url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* user cancelled */ }
  };

  return (
    <Page className="max-w-2xl">
      {q.isLoading ? <PageSkeleton /> : q.isError || !q.data ? (
        <ErrorState message={[404, 409, 425].includes(errStatus(q.error) ?? 0) ? 'This certificate is not ready yet. It appears once the order journey finishes. Checking again shortly.' : errMsg(q.error)} onRetry={() => q.refetch()} />
      ) : (() => {
        const c = q.data;
        return (
          <>
            <article className="relative overflow-hidden rounded-3xl border-2 border-[hsl(var(--forest))] bg-card p-6 shadow-xl rise md:p-10" data-testid="card-certificate">
              <div className="pointer-events-none absolute inset-3 rounded-2xl border border-dashed border-[hsl(var(--forest)/0.35)]" />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-3"><Logo /><DemoChip size="lg" /></div>
                <div className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--soil))]">Demo retirement certificate</div>
                <h1 className="mt-2 font-display text-3xl font-semibold leading-tight md:text-4xl" data-testid="text-cert-project">{c.project_name}</h1>
                <div className="mt-6 grid grid-cols-2 gap-4 border-y border-dashed py-4">
                  <div><div className="text-xs text-muted-foreground">Tonnes retired</div><div className="text-3xl font-bold" data-testid="text-cert-tonnes">{num(c.tonnes)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Vintage</div><div className="text-3xl font-bold">{c.vintage}</div></div>
                </div>
                <p className="mt-6 font-display text-lg leading-relaxed" data-testid="text-cert-text">{c.text}</p>
                <div className="mt-6">
                  <div className="text-xs text-muted-foreground">Demo serial numbers</div>
                  <ul className="mt-1 space-y-1 font-mono text-xs break-all">{c.serial_numbers.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
                <div className="mt-6 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>Issued {fmtDate(c.issued_at)}</span><span className="font-mono">{c.token.slice(0, 12)}</span>
                </div>
                <p className="mt-6 rounded-xl bg-[hsl(var(--marigold)/0.12)] p-3 text-xs">
                  This is a demonstration certificate for fictional credits. No money moved and no registry record exists. It does not state that any organisation is zero carbon.
                </p>
              </div>
            </article>
            <div className="mt-4 flex gap-2">
              <Button onClick={share} className="h-12 flex-1 font-semibold" data-testid="button-share">{copied ? <><Check className="mr-2 h-4 w-4" />Link copied</> : <><Share2 className="mr-2 h-4 w-4" />Share link</>}</Button>
              <Button variant="outline" onClick={() => window.print()} className="tap h-12" data-testid="button-print" aria-label="Print"><Printer className="h-4 w-4" /></Button>
            </div>
          </>
        );
      })()}
    </Page>
  );
}
