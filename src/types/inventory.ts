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
  sofaDetails?: string;
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

export interface PettyCashItem {
  description: string;
  category: string;
  amount: number;
  remarks?: string;
}

export interface Receipt {
  id: string;
  type: 'in' | 'out' | 'petty_cash';
  referenceNo: string;
  date: string;
  items: ReceiptItem[];
  pettyCashItems?: PettyCashItem[];
  grandTotal: number;
  workerId?: string;
  workerName?: string;
  sofaModelId?: string;
  sofaModelName?: string;
  notes?: number;
  payee?: string;
  purpose?: string;
  createdAt: string;
}

// ────────────────────────────────────────────────
// NEW: Payroll types
// ────────────────────────────────────────────────

export interface PayrollEntry {
  id: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';