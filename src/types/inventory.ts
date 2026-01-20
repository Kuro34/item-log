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

// EXTENDED: Added payroll fields to existing Employee interface
export interface Employee {
  id: string;
  name: string;
  createdAt: string;
  
  // Payroll fields (optional for backward compatibility)
  position?: string;
  employmentType?: 'daily' | 'monthly' | 'project';
  dailyRate?: number;
  monthlyRate?: number;
  sssNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
  dateHired?: string;
  isActive?: boolean;
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

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ────────────────────────────────────────────────
// Payroll-specific types (using unified Employee)
// ────────────────────────────────────────────────

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'present' | 'absent' | 'halfday' | 'overtime' | 'leave';
  hoursWorked?: number;
  overtimeHours?: number;
  notes?: string;
  createdAt: string;
}

export interface Deduction {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  amount: number;
  isGovernmentMandated: boolean;
  description?: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  daysWorked: number;
  overtimeHours: number;
  basicPay: number;
  overtimePay: number;
  grossPay: number;
  deductions: Array<{
    deductionId: string;
    deductionName: string;
    amount: number;
  }>;
  totalDeductions: number;
  netPay: number;
  status: 'pending' | 'approved' | 'paid';
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface PayrollPeriod {
  start: string;
  end: string;
  label: string;
}