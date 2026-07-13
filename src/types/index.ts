// ─── Item ────────────────────────────────────────────────────────────────────
export type ItemStatus = 'available' | 'reserved' | 'sold' | 'awaiting';
export type ItemCondition = 'new' | 'like-new' | 'used';

export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  photoUrl: string;
  purchaseDate: string;
  purchasePrice: number;
  condition: ItemCondition;
  supplier: string;
  status: ItemStatus;
  suggestedPrice: number;
  createdAt: string;
}

// ─── Sale ────────────────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'pix' | 'card' | 'transfer' | 'other';
export type DeliveryMethod = 'pickup' | 'delivery_self' | 'delivery_uber' | 'pickup_uber';

export interface Sale {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  salePrice: number;
  purchasePrice: number;
  deliveryMethod: DeliveryMethod;
  deliveryCost: number;
  profit: number;
  marginPercent: number;
  paymentMethod: PaymentMethod;
  buyer: string;
  saleDate: string;
  createdAt: string;
  photoUrl: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────
export interface AppSettings {
  defaultMargin: number; // percent, e.g. 50
  storeName: string;
  userName: string;
}

// ─── User & Authentication ───────────────────────────────────────────────────
export interface User {
  email: string;
  role: 'admin' | 'user';
  passwordHash: string;
}

export interface UserSession {
  email: string;
  role: 'admin' | 'user';
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface MonthlyProfit {
  month: string;   // "Jan", "Fev", etc.
  profit: number;
  revenue: number;
}

export interface CategoryStat {
  category: string;
  profit: number;
  count: number;
  avgDays: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
export const CATEGORIES = [
  'Eletrônicos',
  'Roupas',
  'Móveis',
  'Acessórios',
  'Calçados',
  'Eletrodomésticos',
  'Livros',
  'Esportes',
  'Brinquedos',
  'Ferramentas',
  'Outros',
] as const;

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  new: 'Novo',
  'like-new': 'Seminovo',
  used: 'Usado',
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  sold: 'Vendido',
  awaiting: 'Aguardando entrega',
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  card: 'Cartão',
  transfer: 'Transferência',
  other: 'Outro',
};

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup: 'Retirada',
  delivery_self: 'Entrega por mim',
  delivery_uber: 'Entrega por Uber Moto',
  pickup_uber: 'Retirada por Uber Moto',
};
