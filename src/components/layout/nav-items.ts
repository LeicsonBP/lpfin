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
export const MOBILE_BAR_ITEMS: NavItem[] = [
  NAV_ITEMS[0]!, // Mês
  NAV_ITEMS[2]!, // Compras
  NAV_ITEMS[3]!, // Cartões
  NAV_ITEMS[4]!, // Contas fixas
  NAV_ITEMS[6]!, // Folha
];

/** Itens que só aparecem no menu do topo (mobile). */
export const MOBILE_MENU_ITEMS: NavItem[] = [
  NAV_ITEMS[1]!, // Dashboard
  NAV_ITEMS[5]!, // Ganhos
];
