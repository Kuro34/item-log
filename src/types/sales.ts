// src/types/sales.ts

export interface Customer {
  id: string;
  name: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface SaleItem {
  type: 'sofa' | 'material';
  sofaModelId?: string;
  sofaModelName?: string;
  materialId?: string;
  materialName?: string;
  materialUnit?: string;
  quantity: number;
  yardsPerUnit?: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface SaleCommission {
  agentId: string;
  agentName: string;
  percent: number;
  amount: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxAmount: number;
  total: number;

  // ── NEW commission fields ──
  commissions: SaleCommission[];
  commissionAmount: number;
  netTotal: number;

  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'installment';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  balance: number;
  notes?: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  saleId: string;
  saleNumber: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer';
  referenceNumber?: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  contactNumber?: string;
  email?: string;
  createdAt: string;
}