import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Store, ScanLine, Package, LogOut, UserPlus, Compass } from 'lucide-react';
import { useLogout, useRecordVisit } from '@workspace/api-client-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AskPanel } from './ask-panel';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/market', label: 'Market', icon: Store },
  { href: '/scan', label: 'Scan', icon: ScanLine },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/ask', label: 'Ask', icon: MessageCircle },
  { href: '/pricing', label: 'Pricing', icon: Store },
  { href: '/vision', label: 'Vision', icon: Compass },
];

export function Logo() {
  return (
    <Link href="/" className="tap flex items-center gap-2" data-testid="link-home">
      <img src={`${import.meta.env.BASE_URL}images/zerocarbon-logo.png`} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain" data-testid="image-logo" />
      <span className="font-bold tracking-tight">ZeroCarbon <span className="font-medium text-muted-foreground">Market</span></span>
    </Link>
  );
}

function VisitRecorder() {
  const visit = useRecordVisit();
  const done = useRef(false);
  const mutateRef = useRef(visit.mutate);
  mutateRef.current = visit.mutate;
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const src = new URLSearchParams(window.location.search).get('src') ?? undefined;
    mutateRef.current({ data: src ? { src: src.slice(0, 100) } : {} });
  }, []);
  return null;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { org } = useSession();
  const qc = useQueryClient();
  const logout = useLogout();
  const [askOpen, setAskOpen] = useState(false);
  const isLive = location === '/live';

  const doLogout = () =>
    logout.mutate(undefined, {
      onSettled: async () => {
        await qc.resetQueries();
        navigate('/');
      },
    });

  return (
    <div className="relative z-[2] min-h-[100dvh] overflow-x-hidden">
      <VisitRecorder />
      {!isLive && (
        <header className="sticky top-0 z-40 border-b bg-[hsl(var(--paper)/0.88)] backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
            <Logo />
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={cn('tap flex items-center rounded-lg px-3 text-sm font-medium hover:bg-secondary', location.startsWith(n.href) && 'bg-secondary text-[hsl(var(--forest))]')} data-testid={`link-nav-${n.label.toLowerCase()}`}>
                  {n.label}
                </Link>
              ))}
              <Link href="/live" className="tap flex items-center rounded-lg px-3 text-sm font-medium hover:bg-secondary" data-testid="link-nav-live">Live</Link>
            </nav>
            {org ? (
              <div className="flex min-w-0 items-center gap-2">
                <div className="hidden min-w-0 text-right sm:block">
                  <div className="truncate text-sm font-semibold" data-testid="text-org-name">{org.organisation_name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{org.roles.join(' + ')}{org.buyer_type ? ` · ${org.buyer_type}` : ''}</div>
                </div>
                <Button variant="ghost" size="sm" className="tap" onClick={doLogout} disabled={logout.isPending} data-testid="button-logout">
                  <LogOut className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Switch role</span>
                </Button>
              </div>
            ) : (
              <Link href="/signup" className="tap inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--forest))] px-3 text-sm font-semibold text-[hsl(var(--paper))]" data-testid="link-signup">
                <UserPlus className="h-4 w-4" /> Join demo
              </Link>
            )}
          </div>
        </header>
      )}

      <main className={cn(!isLive && 'pb-28 md:pb-16')}>{children}</main>

      {!isLive && (
        <footer className="mx-auto block w-full max-w-6xl border-t px-4 py-6 pb-28 text-xs text-muted-foreground md:py-8 md:pb-8">
          ZeroCarbon Market is a demonstration. All projects, prices, orders and certificates are fictional. No money moves. Buying credits does not make any organisation zero carbon.
          <span className="ml-3"><Link href="/pricing" className="underline" data-testid="link-footer-pricing">Pricing</Link> · <Link href="/vision" className="underline" data-testid="link-footer-vision">Vision</Link> · <Link href="/comply" className="underline">Comply</Link> · <Link href="/admin" className="underline">Admin</Link></span>
        </footer>
      )}

      {/* Floating Ask */}
      <button
        onClick={() => setAskOpen(true)}
        className={cn('fixed right-4 z-50 flex h-14 items-center gap-2 rounded-full bg-[hsl(var(--marigold))] px-5 font-semibold text-[hsl(var(--ink))] shadow-lg transition-transform hover:scale-105 active:scale-95', isLive ? 'bottom-6' : 'bottom-[88px] md:bottom-6')}
        data-testid="button-floating-ask"
        aria-label="Ask ZeroCarbon"
      >
        <MessageCircle className="h-5 w-5" /> Ask
      </button>
      <Sheet open={askOpen} onOpenChange={setAskOpen}>
        <SheetContent side="right" className="flex w-full flex-col bg-[hsl(var(--paper))] sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Ask ZeroCarbon</SheetTitle>
            <SheetDescription>Answers about this demo market. Nothing here is financial advice.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1"><AskPanel onNavigate={() => setAskOpen(false)} /></div>
        </SheetContent>
      </Sheet>

      {/* Mobile bottom nav */}
      {!isLive && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-[hsl(var(--paper)/0.96)] pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" data-testid="nav-bottom">
          <div className="grid grid-cols-6">
            {NAV.map((n) => {
              const active = location.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium', active ? 'text-[hsl(var(--forest))]' : 'text-muted-foreground')} data-testid={`link-bottom-${n.label.toLowerCase()}`}>
                  <n.icon className={cn('h-5 w-5', active && 'stroke-[2.4]')} />
                  {n.label}
                  <span className={cn('h-1 w-6 rounded-full', active ? 'bg-[hsl(var(--forest))]' : 'bg-transparent')} />
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 py-6 md:py-10', className)}>{children}</div>;
}

export function PageTitle({ eyebrow, title, children, right }: { eyebrow?: string; title: React.ReactNode; children?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 rise">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--soil))]">{eyebrow}</div>}
        <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{title}</h1>
        {children && <div className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{children}</div>}
      </div>
      {right}
    </div>
  );
}
