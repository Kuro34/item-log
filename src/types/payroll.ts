// src/types/payroll.ts

export interface PayrollEmployee {
  id: string;
  name: string;
  position: string;
  employmentType: 'daily' | 'monthly' | 'project';
  dailyRate?: number;
  monthlyRate?: number;
  sssNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
  dateHired: string;
  isActive: boolean;
  createdAt: string;
}

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