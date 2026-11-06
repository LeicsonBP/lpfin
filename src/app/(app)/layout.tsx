import { MobileNav, MobileTopBar, SideNav } from '@/components/layout/nav';
import { requireUser } from '@/lib/data/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="flex min-h-dvh bg-surface-muted">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-4 pb-24 sm:px-5 sm:py-6 md:pb-8">
          <MobileTopBar />
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

