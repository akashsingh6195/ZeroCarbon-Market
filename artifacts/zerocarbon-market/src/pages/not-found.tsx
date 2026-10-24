import { Link } from 'wouter';
import { Page } from '@/components/zc/layout';

export default function NotFound() {
  return (
    <Page className="max-w-lg text-center">
      <div className="font-mono text-sm text-muted-foreground">404</div>
      <h1 className="mt-2 font-display text-3xl font-semibold">This plot is unmapped.</h1>
      <p className="mt-2 text-muted-foreground">The page you asked for does not exist.</p>
      <Link href="/" className="tap mt-6 inline-flex items-center rounded-xl bg-[hsl(var(--forest))] px-5 font-semibold text-[hsl(var(--paper))]" data-testid="link-home-404">Back home</Link>
    </Page>
  );
}
