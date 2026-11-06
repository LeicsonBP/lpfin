import { AppHeader } from '@/components/layout/nav';
import { EntityForm } from '@/components/forms/entity-form';
import { Card, SectionTitle } from '@/components/ui/kit';
import { SurfaceSelect } from '@/components/ui/surface-select';
import { ThemeSelect } from '@/components/ui/theme-select';
import { signOutAction } from '@/lib/actions/auth';
import { updateAccentColorAction, resetAccentColorAction } from '@/lib/actions/settings';
import { getUserSettings } from '@/lib/data/settings';
import { requireUser } from '@/lib/data/session';
import { getTheme } from '@/lib/theme';

export default async function AjustesPage() {
  const { user } = await requireUser();
  const [{ accent, surface }, theme] = await Promise.all([getUserSettings(), getTheme()]);

  return (
    <div className="space-y-4">
      <AppHeader title="Ajustes" subtitle="Tema e personalização da sua conta" />

      <Card>
        <SectionTitle
          title="Tema"
          description="Claro, escuro ou seguindo o sistema — preferência deste dispositivo"
        />
        <div className="max-w-xs">
          <ThemeSelect initialTheme={theme} />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Estilo dos cards"
          description="Sólido (opaco) ou vidro com desfoque — fica salvo na sua conta"
        />
        <SurfaceSelect initial={surface} />
      </Card>

      <Card>
        <SectionTitle
          title="Cor de destaque"
          description="Aplicada a botões, links, barras, gráficos e detalhes do app — fica salva na sua conta"
        />
        <EntityForm
          action={updateAccentColorAction}
          fields={[
            {
              name: 'accent_color',
              label: 'Cor de destaque',
              type: 'color',
              palette: 'accent',
              defaultValue: accent,
              full: true,
            },
          ]}
          submitLabel="Salvar cor de destaque"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-[11px] text-ink-muted">
            Paleta fixa com tons que funcionam bem nos dois temas.
          </p>
          <form action={resetAccentColorAction}>
            <button
              type="submit"
              className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand-400 hover:text-brand-700"
            >
              Restaurar padrão (verde)
            </button>
          </form>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Conta" description={user.email ?? 'Usuário autenticado'} />
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-negative transition hover:bg-negative-soft"
          >
            Sair da conta
          </button>
        </form>
      </Card>
    </div>
  );
}
