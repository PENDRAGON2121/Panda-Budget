import Dexie, { type EntityTable } from 'dexie';
import type { Project, Expense, Installment, Payment, Receipt } from './types';

export class PandaDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  installments!: EntityTable<Installment, 'id'>;
  payments!: EntityTable<Payment, 'id'>;
  receipts!: EntityTable<Receipt, 'id'>;

  constructor() {
    super('panda-wallet');
    this.version(1).stores({
      projects: 'id, createdAt',
      expenses: 'id, projectId',
      installments: 'id, expenseId, index',
      payments: 'id, expenseId, installmentId, date',
      receipts: 'id',
    });
  }
}

export const db = new PandaDB();
