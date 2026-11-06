import { CalendarRange, CreditCard, LayoutDashboard, Receipt, TrendingUp, Wallet } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

/** Navegação principal do app (sidebar no desktop e bottom bar no mobile). */
export const NAV_ITEMS: NavItem[] = [
  { href: '/mes', label: 'Mês', icon: CalendarRange },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/compras', label: 'Compras', icon: Receipt },
  { href: '/cartoes', label: 'Cartões', icon: CreditCard },
  { href: '/contas-fixas', label: 'Contas fixas', icon: Wallet },
  { href: '/ganhos', label: 'Ganhos', icon: TrendingUp },
  { href: '/debitos', label: 'Folha', icon: Receipt },
];

/** Itens exibidos na barra inferior do mobile. */
export const MOBILE_BAR_ITEMS = NAV_ITEMS.slice(0, 5);

/** Itens que só aparecem no menu do topo (mobile). */
export const MOBILE_MENU_ITEMS = NAV_ITEMS.slice(5);
