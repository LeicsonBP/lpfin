import { AppHeader } from '@/components/layout/nav';
import { EntityForm, type EntityField } from '@/components/forms/entity-form';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui/kit';
import { GhostSubmitButton } from '@/components/ui/submit-button';
import { createCardAction, deleteCardAction, updateCardAction } from '@/lib/actions/cards';
import { listCards } from '@/lib/data/cards';
import { formatBRL } from '@/lib/format';
import type { Card as CardModel } from '@/lib/types';

function fields(card?: CardModel): EntityField[] {
  return [
    { name: 'name', label: 'Nome do cartão', required: true, defaultValue: card?.name },
    {
      name: 'credit_limit',
      label: 'Limite',
      type: 'money',
      required: true,
      defaultValue: card?.credit_limit ?? 0,
    },
    {
      name: 'closing_day',
      label: 'Dia de fechamento',
      type: 'number',
      min: 1,
      max: 31,
      required: true,
      defaultValue: card?.closing_day ?? 5,
      hint: 'Também é o "melhor dia de compras"',
    },
    {
      name: 'due_day',
      label: 'Dia de vencimento',
      type: 'number',
      min: 1,
      max: 31,
      required: true,
      defaultValue: card?.due_day ?? 15,
    },
    { name: 'color', label: 'Cor (hex)', defaultValue: card?.color ?? '#0e6855' },
    { name: 'is_active', label: 'Cartão ativo', type: 'checkbox', defaultValue: card?.is_active ?? true },
  ];
}

export default async function CartoesPage() {
  const cards = await listCards();

  return (
    <div className="space-y-4">
      <AppHeader title="Cartões" subtitle="Limite, fechamento e vencimento de cada cartão" />

      <Card>
        <SectionTitle title="Novo cartão" description="Usado para agrupar as compras do mês" />
        <EntityForm action={createCardAction} fields={fields()} submitLabel="Criar cartão" />
      </Card>

      <Card>
        <SectionTitle title="Meus cartões" description={`${cards.length} cadastrado(s)`} />

        {cards.length === 0 ? (
          <EmptyState title="Nenhum cartão cadastrado" description="Crie o primeiro acima." />
        ) : (
          <ul className="space-y-2">
            {cards.map((card) => (
              <li key={card.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: card.color }}
                      />
                      {card.name}
                      {!card.is_active ? <Badge>inativo</Badge> : null}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      limite {formatBRL(card.credit_limit)} · fecha dia {card.closing_day} · vence
                      dia {card.due_day}
                    </p>
                  </div>

                  <form action={deleteCardAction}>
                    <input type="hidden" name="id" value={card.id} />
                    <GhostSubmitButton className="text-negative" title="Excluir cartão">
                      excluir
                    </GhostSubmitButton>
                  </form>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-brand-700">
                    Editar
                  </summary>
                  <div className="mt-3">
                    <EntityForm
                      action={updateCardAction}
                      fields={fields(card)}
                      id={card.id}
                      submitLabel="Salvar alterações"
                    />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
