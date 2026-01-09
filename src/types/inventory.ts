export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
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
  notes: string;
  date: string;
  createdAt: string;
  workerId?: string;
  workerName?: string;
  sofaModelId?: string;
  sofaModelName?: string;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
