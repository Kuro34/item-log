// src/components/payroll/PayrollReport.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, CheckCircle, DollarSign, Printer, Trash } from 'lucide-react';
import { PayrollRecord } from '@/types/inventory';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCurrency = (value: number) =>
  `₱ ${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

interface PayrollReportProps {
  records: PayrollRecord[];
  onUpdate: (id: string, updates: Partial<PayrollRecord>) => void;
  onDelete: (id: string) => void;
}

export function PayrollReport({ records, onUpdate, onDelete }: PayrollReportProps) {
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    return styles[status] || '';
  };

  const handleApprove = (record: PayrollRecord) => {
    onUpdate(record.id, {
      status: 'approved',
      approvedDate: new Date().toISOString(),
    });
  };

  const handleMarkPaid = (record: PayrollRecord) => {
    onUpdate(record.id, {
      status: 'paid',
      paidDate: new Date().toISOString(),
    });
  };

  const handlePrintPayslip = (record: PayrollRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${record.employeeName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; font-size: 12pt; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .company { font-size: 18pt; font-weight: bold; margin-bottom: 5px; }
            .payslip-title { font-size: 14pt; color: #666; }
            .info-section { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { font-weight: bold; color: #444; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: bold; }
            .total-row { font-weight: bold; font-size: 14pt; background: #f9f9f9; }
            .net-pay { color: #16a34a; }
            .footer { margin-top: 40px; text-align: center; font-size: 10pt; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">JJB FURNITURE</div>
            <div class="payslip-title">PAYSLIP</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span><span class="label">Employee:</span> ${record.employeeName}</span>
              <span><span class="label">Pay Period:</span> ${formatDate(record.periodStart)} - ${formatDate(record.periodEnd)}</span>
            </div>
            <div class="info-row">
              <span><span class="label">Days Worked:</span> ${record.daysWorked}</span>
              <span><span class="label">OT Hours:</span> ${record.overtimeHours || 0}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Pay</td>
                <td style="text-align: right;">${formatCurrency(record.basicPay)}</td>
              </tr>
              ${record.overtimePay > 0 ? `
              <tr>
                <td>Overtime Pay</td>
                <td style="text-align: right;">${formatCurrency(record.overtimePay)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td>GROSS PAY</td>
                <td style="text-align: right;">${formatCurrency(record.grossPay)}</td>
              </tr>
              ${record.deductions.map(ded => `
              <tr>
                <td>Less: ${ded.deductionName}</td>
                <td style="text-align: right; color: #dc2626;">-${formatCurrency(ded.amount)}</td>
              </tr>
              `).join('')}
              <tr class="total-row">
                <td>Total Deductions</td>
                <td style="text-align: right; color: #dc2626;">-${formatCurrency(record.totalDeductions)}</td>
              </tr>
              <tr class="total-row">
                <td>NET PAY</td>
                <td style="text-align: right;" class="net-pay">${formatCurrency(record.netPay)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>This is a computer-generated payslip. No signature required.</p>
            <p>Generated on ${formatDate(new Date().toISOString())}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Employee</th>
                <th className="p-3 text-left font-medium">Period</th>
                <th className="p-3 text-right font-medium">Days</th>
                <th className="p-3 text-right font-medium">Gross Pay</th>
                <th className="p-3 text-right font-medium">Net Pay</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No payroll records yet
                  </td>
                </tr>
              ) : (
                sortedRecords.map(record => (
                  <tr key={record.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{record.employeeName}</td>
                    <td className="p-3 text-sm">
                      {formatDate(record.periodStart)} - {formatDate(record.periodEnd)}
                    </td>
                    <td className="p-3 text-right">{record.daysWorked}</td>
                    <td className="p-3 text-right">{formatCurrency(record.grossPay)}</td>
                    <td className="p-3 text-right font-semibold text-green-600">
                      {formatCurrency(record.netPay)}
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusBadge(record.status)}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          {selectedRecord && selectedRecord.id === record.id && (
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Payroll Details - {selectedRecord.employeeName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Period</p>
                                    <p className="font-medium">
                                      {formatDate(selectedRecord.periodStart)} - {formatDate(selectedRecord.periodEnd)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className={getStatusBadge(selectedRecord.status)}>
                                      {selectedRecord.status}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                  <div className="flex justify-between">
                                    <span>Days Worked:</span>
                                    <span className="font-medium">{selectedRecord.daysWorked}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Overtime Hours:</span>
                                    <span className="font-medium">{selectedRecord.overtimeHours}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Basic Pay:</span>
                                    <span className="font-medium">{formatCurrency(selectedRecord.basicPay)}</span>
                                  </div>
                                  {selectedRecord.overtimePay > 0 && (
                                    <div className="flex justify-between">
                                      <span>Overtime Pay:</span>
                                      <span className="font-medium">{formatCurrency(selectedRecord.overtimePay)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-semibold border-t pt-2">
                                    <span>Gross Pay:</span>
                                    <span>{formatCurrency(selectedRecord.grossPay)}</span>
                                  </div>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                  <p className="font-medium mb-2">Deductions:</p>
                                  {selectedRecord.deductions.map(ded => (
                                    <div key={ded.deductionId} className="flex justify-between text-sm">
                                      <span>{ded.deductionName}:</span>
                                      <span className="text-red-600">-{formatCurrency(ded.amount)}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between font-semibold border-t pt-2">
                                    <span>Total Deductions:</span>
                                    <span className="text-red-600">-{formatCurrency(selectedRecord.totalDeductions)}</span>
                                  </div>
                                </div>

                                <div className="border-t pt-4">
                                  <div className="flex justify-between text-xl font-bold">
                                    <span>NET PAY:</span>
                                    <span className="text-green-600">{formatCurrency(selectedRecord.netPay)}</span>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintPayslip(record)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        {record.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(record)}
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}

                        {record.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkPaid(record)}
                            title="Mark as Paid"
                          >
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(record.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}