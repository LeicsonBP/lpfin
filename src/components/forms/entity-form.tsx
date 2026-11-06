'use client';

import { clsx } from 'clsx';
import { useActionState, useState } from 'react';

import { SubmitButton } from '@/components/ui/submit-button';
import { Field, Input, MoneyInput, Select } from '@/components/ui/kit';
import type { ActionResult } from '@/lib/types';

import { ColorPicker } from './color-picker';

export interface EntityField {
  name: string;
  label?: string;
  type?: 'text' | 'money' | 'date' | 'select' | 'checkbox' | 'hidden' | 'number' | 'color';
  defaultValue?: string | number | boolean | null;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  /** paleta exibida quando type = 'color' */
  palette?: 'card' | 'accent';
  /** só aparece quando outro campo estiver em um destes valores */
  showWhen?: { field: string; equals: string[] };
  /** ocupa as duas colunas no grid */
  full?: boolean;
}

export type EntityFormAction = (
  prevState: ActionResult | undefined,
  formData: FormData,
) => Promise<ActionResult>;

/**
 * Formulário genérico de cadastro/edição com validação no servidor (zod)
 * e retorno amigável de erros por campo.
 */
export function EntityForm({
  action,
  fields,
  submitLabel = 'Salvar',
  id,
  extra,
  className,
}: {
  action: EntityFormAction;
  fields: EntityField[];
  submitLabel?: string;
  id?: string;
  extra?: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  // guarda o valor dos campos que controlam a visibilidade de outros (ex.: tipo)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};

    for (const field of fields) {
      if (typeof field.defaultValue === 'string' || typeof field.defaultValue === 'number') {
        initial[field.name] = String(field.defaultValue);
      }
    }

    return initial;
  });

  function setValue(name: string, value: string) {
    setValues((current) => (current[name] === value ? current : { ...current, [name]: value }));
  }

  const visibleFields = fields.filter((field) => {
    if (!field.showWhen) return true;
    return field.showWhen.equals.includes(values[field.showWhen.field] ?? '');
  });

  return (
    <form action={formAction} className={clsx('space-y-4', className)}>
      {id ? <input type="hidden" name="id" value={id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleFields.map((field) => {
          const error = state && !state.ok ? state.fieldErrors?.[field.name]?.[0] : undefined;
          const inputId = `${field.name}-${id ?? 'new'}`;

          if (field.type === 'hidden') {
            return (
              <input
                key={field.name}
                type="hidden"
                name={field.name}
                value={String(field.defaultValue ?? '')}
              />
            );
          }

          if (field.type === 'checkbox') {
            return (
              <label
                key={field.name}
                htmlFor={inputId}
                className="flex items-center gap-2 self-end rounded-xl border border-line bg-surface px-3 py-2 text-sm"
              >
                <input
                  id={inputId}
                  type="checkbox"
                  name={field.name}
                  defaultChecked={field.defaultValue === true}
                  className="size-4 rounded border-line text-brand-700 focus:ring-brand-500"
                />
                <span className="text-ink">{field.label}</span>
              </label>
            );
          }

          return (
            <Field
              key={field.name}
              label={field.label ?? field.name}
              htmlFor={inputId}
              error={error}
              hint={field.hint}
              className={field.full ? 'sm:col-span-2' : undefined}
            >
              {field.type === 'select' ? (
                <Select
                  id={inputId}
                  name={field.name}
                  defaultValue={String(field.defaultValue ?? '')}
                  required={field.required}
                  onChange={(event) => setValue(field.name, event.target.value)}
                >
                  {field.placeholder ? (
                    <option value="">{field.placeholder}</option>
                  ) : null}
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              ) : field.type === 'color' ? (
                <ColorPicker
                  name={field.name}
                  palette={field.palette}
                  defaultValue={
                    typeof field.defaultValue === 'string' && field.defaultValue
                      ? field.defaultValue
                      : '#0e6855'
                  }
                />
              ) : field.type === 'money' ? (
                <MoneyInput
                  id={inputId}
                  name={field.name}
                  defaultValue={
                    typeof field.defaultValue === 'number'
                      ? field.defaultValue.toFixed(2).replace('.', ',')
                      : String(field.defaultValue ?? '')
                  }
                  required={field.required}
                />
              ) : (
                <Input
                  id={inputId}
                  name={field.name}
                  type={field.type ?? 'text'}
                  defaultValue={
                    field.defaultValue === null || field.defaultValue === undefined
                      ? ''
                      : String(field.defaultValue)
                  }
                  placeholder={field.placeholder}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                />
              )}
            </Field>
          );
        })}
      </div>

      {extra}

      {state && !state.ok ? (
        <p className="rounded-xl bg-negative-soft px-3 py-2 text-xs font-medium text-negative">
          {state.error}
        </p>
      ) : null}

      {state && state.ok && state.message ? (
        <p className="rounded-xl bg-positive-soft px-3 py-2 text-xs font-medium text-positive">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
