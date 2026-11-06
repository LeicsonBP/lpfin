import { AppHeader } from '@/components/layout/nav';
import { EntityForm } from '@/components/forms/entity-form';
import { Card, SectionTitle } from '@/components/ui/kit';
import { ThemeSelect } from '@/components/ui/theme-select';
import { signOutAction } from '@/lib/actions/auth';
import { updateAccentColorAction } from '@/lib/actions/settings';
import { getAccentColor } from '@/lib/data/settings';
import { requireUser } from '@/lib/data/session';
import { getTheme } from '@/lib/theme';

export default async function AjustesPage() {
  const { user } = await requireUser();
  const [accent, theme] = await Promise.all([getAccentColor(), getTheme()]);

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
              defaultValue: accent,
              full: true,
            },
          ]}
          submitLabel="Salvar cor de destaque"
        />
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
