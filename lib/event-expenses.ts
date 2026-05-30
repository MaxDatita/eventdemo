export const EXPENSE_CATEGORIES = [
  'Salon',
  'Catering',
  'Bebidas',
  'Torta y dulce',
  'Foto y video',
  'Musica y DJ',
  'Decoracion',
  'Iluminacion y tecnica',
  'Mobiliario y alquileres',
  'Invitaciones y grafica',
  'Souvenirs y regalos',
  'Vestuario y belleza',
  'Transporte y logistica',
  'Personal y servicios',
  'Imprevistos',
  'Otros',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExpenseStatus = 'pendiente' | 'pagado';

export type AdminExpenseRecord = {
  id: string;
  concepto: string;
  categoria: ExpenseCategory;
  monto: number;
  medioPago: string | null;
  fecha: string | null;
  proveedor: string | null;
  notas: string | null;
  estado: ExpenseStatus;
  createdAt: string | null;
  updatedAt: string | null;
  rowNumber: number;
};

export type ExpensesConfig = {
  useBudget: boolean;
  budgetTotal: number | null;
};

