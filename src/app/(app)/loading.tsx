import { Card } from '@/components/ui/kit';

/** Skeleton exibido enquanto os dados do mês/dashboard são carregados. */
export default function AppLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-surface" />
      <Card>
        <div className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-surface-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="h-64 animate-pulse rounded-2xl bg-surface" />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="h-40 animate-pulse rounded-2xl bg-surface" />
          <div className="h-40 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    </div>
  );
}
