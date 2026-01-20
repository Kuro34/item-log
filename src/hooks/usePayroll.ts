// src/hooks/usePayroll.ts
import { useState, useEffect } from 'react';
import { Employee, Attendance, Deduction, PayrollRecord } from '@/types/inventory';

const EMPLOYEES_KEY = 'payroll_employees';
const ATTENDANCE_KEY = 'payroll_attendance';
const DEDUCTIONS_KEY = 'payroll_deductions';
const PAYROLL_KEY = 'payroll_records';

export function usePayroll() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);

  useEffect(() => {
    const savedEmployees = localStorage.getItem(EMPLOYEES_KEY);
    const savedAttendance = localStorage.getItem(ATTENDANCE_KEY);
    const savedDeductions = localStorage.getItem(DEDUCTIONS_KEY);
    const savedPayroll = localStorage.getItem(PAYROLL_KEY);

    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
    if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
    if (savedDeductions) setDeductions(JSON.parse(savedDeductions));
    if (savedPayroll) setPayrollRecords(JSON.parse(savedPayroll));

    // Initialize default deductions if none exist
    if (!savedDeductions) {
      const defaultDeductions: Deduction[] = [
        {
          id: crypto.randomUUID(),
          name: 'SSS',
          type: 'percentage',
          amount: 3.63,
          isGovernmentMandated: true,
          description: 'Social Security System',
          createdAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: 'PhilHealth',
          type: 'percentage',
          amount: 2,
          isGovernmentMandated: true,
          description: 'Philippine Health Insurance',
          createdAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          name: 'Pag-IBIG',
          type: 'percentage',
          amount: 2,
          isGovernmentMandated: true,
          description: 'Home Development Mutual Fund',
          createdAt: new Date().toISOString(),
        },
      ];
      setDeductions(defaultDeductions);
      localStorage.setItem(DEDUCTIONS_KEY, JSON.stringify(defaultDeductions));
    }
  }, []);

  const saveEmployees = (data: Employee[]) => {
    setEmployees(data);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(data));
  };

  const saveAttendance = (data: Attendance[]) => {
    setAttendance(data);
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(data));
  };

  const saveDeductions = (data: Deduction[]) => {
    setDeductions(data);
    localStorage.setItem(DEDUCTIONS_KEY, JSON.stringify(data));
  };

  const savePayrollRecords = (data: PayrollRecord[]) => {
    setPayrollRecords(data);
    localStorage.setItem(PAYROLL_KEY, JSON.stringify(data));
  };

  // Employee CRUD
  const addEmployee = (emp: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmp: Employee = {
      ...emp,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveEmployees([...employees, newEmp]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    saveEmployees(employees.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEmployee = (id: string) => {
    saveEmployees(employees.filter(e => e.id !== id));
  };

  // Attendance CRUD
  const addAttendance = (att: Omit<Attendance, 'id' | 'createdAt'>) => {
    const newAtt: Attendance = {
      ...att,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveAttendance([...attendance, newAtt]);
  };

  const updateAttendance = (id: string, updates: Partial<Attendance>) => {
    saveAttendance(attendance.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAttendance = (id: string) => {
    saveAttendance(attendance.filter(a => a.id !== id));
  };

  // Deduction CRUD
  const addDeduction = (ded: Omit<Deduction, 'id' | 'createdAt'>) => {
    const newDed: Deduction = {
      ...ded,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveDeductions([...deductions, newDed]);
  };

  const updateDeduction = (id: string, updates: Partial<Deduction>) => {
    saveDeductions(deductions.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDeduction = (id: string) => {
    saveDeductions(deductions.filter(d => d.id !== id));
  };

  // Payroll Generation
  const generatePayroll = (employeeId: string, periodStart: string, periodEnd: string): PayrollRecord | null => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    // Get attendance records for period
    const periodAttendance = attendance.filter(a => 
      a.employeeId === employeeId &&
      a.date >= periodStart &&
      a.date <= periodEnd
    );

    let daysWorked = 0;
    let overtimeHours = 0;

    periodAttendance.forEach(att => {
      if (att.status === 'present') daysWorked += 1;
      if (att.status === 'halfday') daysWorked += 0.5;
      if (att.status === 'overtime' || att.overtimeHours) {
        overtimeHours += att.overtimeHours || 0;
      }
    });

    let basicPay = 0;
    if (employee.employmentType === 'daily' && employee.dailyRate) {
      basicPay = daysWorked * employee.dailyRate;
    } else if (employee.employmentType === 'monthly' && employee.monthlyRate) {
      basicPay = employee.monthlyRate;
    }

    // Overtime calculation (1.25x for daily, or hourly rate for monthly)
    const overtimePay = employee.dailyRate 
      ? (employee.dailyRate / 8) * 1.25 * overtimeHours
      : 0;

    const grossPay = basicPay + overtimePay;

    // Calculate deductions
    const appliedDeductions = deductions.map(ded => {
      const amount = ded.type === 'percentage' 
        ? (grossPay * ded.amount) / 100
        : ded.amount;
      
      return {
        deductionId: ded.id,
        deductionName: ded.name,
        amount: Math.round(amount * 100) / 100,
      };
    });

    const totalDeductions = appliedDeductions.reduce((sum, d) => sum + d.amount, 0);
    const netPay = grossPay - totalDeductions;

    return {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      employeeName: employee.name,
      periodStart,
      periodEnd,
      daysWorked,
      overtimeHours,
      basicPay,
      overtimePay,
      grossPay,
      deductions: appliedDeductions,
      totalDeductions,
      netPay,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  };

  const addPayrollRecord = (record: PayrollRecord) => {
    savePayrollRecords([...payrollRecords, record]);
  };

  const updatePayrollRecord = (id: string, updates: Partial<PayrollRecord>) => {
    savePayrollRecords(payrollRecords.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePayrollRecord = (id: string) => {
    savePayrollRecords(payrollRecords.filter(p => p.id !== id));
  };

  return {
    employees,
    attendance,
    deductions,
    payrollRecords,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    addDeduction,
    updateDeduction,
    deleteDeduction,
    generatePayroll,
    addPayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
  };
}