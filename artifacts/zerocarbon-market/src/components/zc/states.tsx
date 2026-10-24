import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.05)] p-6 text-center" data-testid="status-error">
      <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
      <p className="mt-2 text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4 tap" onClick={onRetry} data-testid="button-retry">
          <RotateCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}

export function CardSkeletons({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-12" /></div>
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

export function NoMoneyNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      Every project, price and certificate here is fictional. No money moves and no real credits change hands.
    </p>
  );
}
