// src/types/inventory.ts

export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  costPerUnit: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  createdAt: string;
}

export interface SofaModel {
  id: string;
  name: string;
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  materialId: string;
  materialName: string;
  type: 'in' | 'out';
  quantity: number;
  notes?: number;
  date: string;
  createdAt: string;
  workerId?: string;
  workerName?: string;
  sofaModelId?: string;
  sofaModelName?: string;
}

// ────────────────────────────────────────────────
// Receipt-related types
// ────────────────────────────────────────────────

export interface ReceiptItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  yardsPerRoll?: number;
  unitPrice: number;
  total: number;
}

// NEW: Petty cash expense line item
export interface PettyCashItem {
  description: string;
  category: string;  // e.g., "Transportation", "Meals", "Supplies", "Utilities"
  amount: number;
  remarks?: string;
}

export interface Receipt {
  id: string;
  type: 'in' | 'out' | 'petty_cash';  // ← Added 'petty_cash'
  referenceNo: string;
  date: string;
  items: ReceiptItem[];
  pettyCashItems?: PettyCashItem[];  // ← NEW: for petty cash vouchers
  grandTotal: number;
  workerId?: string;
  workerName?: string;
  sofaModelId?: string;
  sofaModelName?: string;
  notes?: number;
  payee?: string;  // ← NEW: person receiving/requesting the cash
  purpose?: string;  // ← NEW: overall purpose of petty cash
  createdAt: string;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';