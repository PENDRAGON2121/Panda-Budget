export interface Project {
  id: string;
  name: string;
  icon?: string;
  currency: string;
  totalBudget: number;
  note?: string;
  createdAt: number;
}

export interface Expense {
  id: string;
  projectId: string;
  name: string;
  icon?: string;
  type: 'single' | 'installments';
  plannedAmount: number;
  note?: string;
  createdAt: number;
}

export interface Installment {
  id: string;
  expenseId: string;
  index: number;
  label?: string;
  plannedAmount: number;
  dueDate?: number;
}

export interface Payment {
  id: string;
  expenseId: string;
  installmentId?: string;
  amount: number;
  date: number;
  receiptId?: string;
  note?: string;
  createdAt: number;
}

export interface Receipt {
  id: string;
  blob: Blob;
  mime: string;
}
