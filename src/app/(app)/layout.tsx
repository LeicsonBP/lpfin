import { MobileNav, MobileTopBar, SideNav } from '@/components/layout/nav';
import { requireUser } from '@/lib/data/session';
import { getTheme } from '@/lib/theme';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const theme = await getTheme();

  return (
    <div className="flex min-h-dvh bg-surface-muted">
      <SideNav theme={theme} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-4 pb-24 sm:px-5 sm:py-6 md:pb-8">
          <MobileTopBar theme={theme} />
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}


