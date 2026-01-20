// src/components/payroll/PayrollGeneration.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Check } from 'lucide-react';
import { Employee, Attendance, Deduction, PayrollRecord } from '@/types/inventory';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCurrency = (value: number) =>
  `₱ ${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const getPayPeriods = () => {
  const periods = [];
  const now = new Date();
  
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    // 1st - 15th
    periods.push({
      value: `${year}-${String(month + 1).padStart(2, '0')}-01_${year}-${String(month + 1).padStart(2, '0')}-15`,
      label: `${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} 1-15`,
      start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      end: `${year}-${String(month + 1).padStart(2, '0')}-15`,
    });
    
    // 16th - End of month
    const lastDay = new Date(year, month + 1, 0).getDate();
    periods.push({
      value: `${year}-${String(month + 1).padStart(2, '0')}-16_${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`,
      label: `${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} 16-${lastDay}`,
      start: `${year}-${String(month + 1).padStart(2, '0')}-16`,
      end: `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`,
    });
  }
  
  return periods;
};

interface PayrollGenerationProps {
  employees: Employee[];
  attendance: Attendance[];
  deductions: Deduction[];
  onGenerate: (record: PayrollRecord) => void;
}

export function PayrollGeneration({ employees, attendance, deductions, onGenerate }: PayrollGenerationProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [preview, setPreview] = useState<PayrollRecord | null>(null);

  const periods = getPayPeriods();
  const activeEmployees = employees.filter(e => e.isActive !== false);

  const handlePreview = () => {
    if (!selectedEmployee || !selectedPeriod) return;

    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    const [start, end] = selectedPeriod.split('_');
    const periodAttendance = attendance.filter(a =>
      a.employeeId === selectedEmployee &&
      a.date >= start &&
      a.date <= end
    );

    let daysWorked = 0;
    let overtimeHours = 0;

    periodAttendance.forEach(att => {
      if (att.status === 'present') daysWorked += 1;
      if (att.status === 'halfday') daysWorked += 0.5;
      if (att.status === 'overtime' || att.overtimeHours) {
        daysWorked += 1;
        overtimeHours += att.overtimeHours || 0;
      }
    });

    let basicPay = 0;
    if (employee.employmentType === 'daily' && employee.dailyRate) {
      basicPay = daysWorked * employee.dailyRate;
    } else if (employee.employmentType === 'monthly' && employee.monthlyRate) {
      basicPay = employee.monthlyRate / 2; // Semi-monthly
    }

    const overtimePay = employee.dailyRate
      ? (employee.dailyRate / 8) * 1.25 * overtimeHours
      : 0;

    const grossPay = basicPay + overtimePay;

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

    const record: PayrollRecord = {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      employeeName: employee.name,
      periodStart: start,
      periodEnd: end,
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

    setPreview(record);
  };

  const handleGenerate = () => {
    if (preview) {
      onGenerate(preview);
      setPreview(null);
      setSelectedEmployee('');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Generate Payroll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pay Period</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} - {emp.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handlePreview}
            className="w-full"
            disabled={!selectedEmployee || !selectedPeriod}
          >
            <Calculator className="mr-2 h-4 w-4" /> Calculate Payroll
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {!preview ? (
            <p className="text-center text-muted-foreground py-8">
              Select period and employee to preview payroll
            </p>
          ) : (
            <div className="space-y-4">
              <div className="border-b pb-3">
                <p className="font-semibold text-lg">{preview.employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(preview.periodStart)} - {formatDate(preview.periodEnd)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Days Worked:</span>
                  <span className="font-medium">{preview.daysWorked}</span>
                </div>
                {preview.overtimeHours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Overtime Hours:</span>
                    <span className="font-medium">{preview.overtimeHours}h</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Basic Pay:</span>
                  <span className="font-medium">{formatCurrency(preview.basicPay)}</span>
                </div>
                {preview.overtimePay > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Overtime Pay:</span>
                    <span className="font-medium">{formatCurrency(preview.overtimePay)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold mb-2">
                  <span>Gross Pay:</span>
                  <span>{formatCurrency(preview.grossPay)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Deductions:</p>
                {preview.deductions.map(ded => (
                  <div key={ded.deductionId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{ded.deductionName}:</span>
                    <span className="text-red-600">-{formatCurrency(ded.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Total Deductions:</span>
                  <span className="text-red-600">-{formatCurrency(preview.totalDeductions)}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Pay:</span>
                  <span className="text-green-600">{formatCurrency(preview.netPay)}</span>
                </div>
              </div>

              <Button onClick={handleGenerate} className="w-full mt-4">
                <Check className="mr-2 h-4 w-4" /> Generate Payroll Record
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}