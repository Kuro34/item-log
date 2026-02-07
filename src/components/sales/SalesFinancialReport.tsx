// src/components/sales/SalesFinancialReport.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, getWeek, startOfWeek, endOfWeek } from 'date-fns';
import { Sale} from '@/types/sales';
import { Receipt } from '@/hooks/useInventory';

interface SalesFinancialReportProps {
  sales: Sale[];
  receipts: Receipt[];
}

type ReportPeriod = 'monthly' | 'weekly' | 'yearly';

export function SalesFinancialReport({ sales, receipts }: SalesFinancialReportProps) {
  const [open, setOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedWeek, setSelectedWeek] = useState('1');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const weeks = Array.from({ length: 5 }, (_, i) => ({ value: (i + 1).toString(), label: `Week ${i + 1}` }));

  const formatCurrency = (value: number) =>
    `₱ ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getWeekRange = (year: number, month: number, weekNum: number) => {
    const firstDay = new Date(year, month - 1, 1);
    const firstMonday = startOfWeek(firstDay, { weekStartsOn: 1 });
    
    // If first Monday is in previous month, start from first day of month
    const weekStart = firstMonday.getMonth() === month - 1 ? firstMonday : firstDay;
    const targetWeekStart = new Date(weekStart);
    targetWeekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);
    
    const weekEnd = new Date(targetWeekStart);
    weekEnd.setDate(targetWeekStart.getDate() + 6);
    
    // Ensure week end doesn't exceed month
    const monthEnd = endOfMonth(new Date(year, month - 1));
    return {
      start: targetWeekStart,
      end: weekEnd > monthEnd ? monthEnd : weekEnd
    };
  };

  const handlePrintReport = () => {
    let periodStart: Date;
    let periodEnd: Date;
    let periodLabel: string;

    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const week = parseInt(selectedWeek);

    switch (reportPeriod) {
      case 'yearly':
        periodStart = startOfYear(new Date(year, 0));
        periodEnd = endOfYear(new Date(year, 0));
        periodLabel = `Year ${year}`;
        break;
      case 'monthly':
        periodStart = startOfMonth(new Date(year, month - 1));
        periodEnd = endOfMonth(new Date(year, month - 1));
        periodLabel = `${months.find(m => m.value === selectedMonth)?.label} ${year}`;
        break;
      case 'weekly':
        const weekRange = getWeekRange(year, month, week);
        periodStart = weekRange.start;
        periodEnd = weekRange.end;
        periodLabel = `Week ${week} of ${months.find(m => m.value === selectedMonth)?.label} ${year} (${format(periodStart, 'MMM dd')} - ${format(periodEnd, 'MMM dd')})`;
        break;
    }

    // Filter sales and receipts by period
    const filteredSales = sales.filter(s => {
      const saleDate = new Date(s.saleDate);
      return isWithinInterval(saleDate, { start: periodStart, end: periodEnd });
    });

    const filteredReceipts = receipts.filter(r => {
      const receiptDate = new Date(r.date);
      return isWithinInterval(receiptDate, { start: periodStart, end: periodEnd });
    });

    // Calculate financial metrics
    const totalSalesRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalReceived = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
    const totalOutstanding = filteredSales.reduce((sum, s) => sum + s.balance, 0);

    // NEW: Calculate total commissions
    const totalCommissions = filteredSales.reduce((sum, s) => sum + (s.commissionAmount || 0), 0);

    const stockInExpenses = filteredReceipts
      .filter(r => r.type === 'in')
      .reduce((sum, r) => sum + r.grandTotal, 0);

    const pettyCashExpenses = filteredReceipts
      .filter(r => r.type === 'petty_cash')
      .reduce((sum, r) => sum + r.grandTotal, 0);

    const totalExpenses = stockInExpenses + pettyCashExpenses;
    
    // NEW: Net income after commissions
    const revenueAfterCommissions = totalSalesRevenue - totalCommissions;
    const netIncome = revenueAfterCommissions - totalExpenses;
    const profitMargin = totalSalesRevenue > 0 ? (netIncome / totalSalesRevenue) * 100 : 0;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sales & Financial Report - ${periodLabel}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              font-size: 10pt; 
              line-height: 1.4;
              color: #1a1a1a;
            }
            .header { 
              text-align: center; 
              margin-bottom: 25px; 
              border-bottom: 3px solid #2563eb;
              padding-bottom: 15px;
            }
            .company-name { 
              font-size: 24pt; 
              font-weight: bold; 
              color: #1e3a8a;
              margin: 0;
            }
            .report-title { 
              font-size: 16pt; 
              color: #475569;
              margin: 5px 0;
            }
            .period-label {
              font-size: 12pt;
              color: #64748b;
              margin: 5px 0;
            }
            
            .financial-summary {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 25px 0;
              page-break-inside: avoid;
            }
            .metric-card {
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              background: #f8fafc;
            }
            .metric-card.revenue { border-color: #10b981; background: #f0fdf4; }
            .metric-card.expense { border-color: #ef4444; background: #fef2f2; }
            .metric-card.profit { border-color: #3b82f6; background: #eff6ff; }
            .metric-card.loss { border-color: #f59e0b; background: #fffbeb; }
            .metric-card.margin { border-color: #8b5cf6; background: #faf5ff; }
            
            .metric-label {
              font-size: 9pt;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
            }
            .metric-card.revenue .metric-label { color: #047857; }
            .metric-card.expense .metric-label { color: #dc2626; }
            .metric-card.profit .metric-label { color: #2563eb; }
            .metric-card.loss .metric-label { color: #d97706; }
            .metric-card.margin .metric-label { color: #7c3aed; }
            
            .metric-value {
              font-size: 20pt;
              font-weight: bold;
              margin: 5px 0;
            }
            .metric-card.revenue .metric-value { color: #065f46; }
            .metric-card.expense .metric-value { color: #991b1b; }
            .metric-card.profit .metric-value { color: #1e40af; }
            .metric-card.loss .metric-value { color: #b45309; }
            .metric-card.margin .metric-value { color: #6d28d9; }
            
            .metric-detail {
              font-size: 8pt;
              color: #64748b;
              margin-top: 8px;
            }
            
            .section {
              margin: 25px 0;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 14pt;
              font-weight: bold;
              color: #1e3a8a;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e2e8f0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 9pt;
            }
            th, td {
              padding: 10px 8px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            th {
              background: #f1f5f9;
              font-weight: 600;
              color: #334155;
              text-transform: uppercase;
              font-size: 8pt;
              letter-spacing: 0.5px;
            }
            tr:hover { background: #f8fafc; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .status-badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 8pt;
              font-weight: 600;
            }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-partial { background: #fed7aa; color: #92400e; }
            .status-unpaid { background: #fee2e2; color: #991b1b; }
            
            .type-badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 8pt;
              font-weight: 600;
            }
            .type-in { background: #dcfce7; color: #166534; }
            .type-out { background: #dbeafe; color: #1e40af; }
            .type-petty { background: #fef3c7; color: #92400e; }
            
            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              font-size: 8pt;
              color: #64748b;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin: 15px 0;
            }
            .summary-item {
              text-align: center;
              padding: 10px;
              background: #f8fafc;
              border-radius: 6px;
            }
            .summary-item-label {
              font-size: 8pt;
              color: #64748b;
              margin-bottom: 3px;
            }
            .summary-item-value {
              font-size: 12pt;
              font-weight: bold;
              color: #1e3a8a;
            }
            
            @media print {
              .no-print { display: none; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="company-name">JJB FURNITURE</h1>
            <h2 class="report-title">Sales & Financial Report</h2>
            <p class="period-label">${periodLabel}</p>
          </div>

          <!-- Financial Summary Cards -->
          <div class="financial-summary">
            <div class="metric-card revenue">
              <div class="metric-label">Total Sales Revenue</div>
              <div class="metric-value">${formatCurrency(totalSalesRevenue)}</div>
              <div class="metric-detail">
                Received: ${formatCurrency(totalReceived)}<br/>
                Outstanding: ${formatCurrency(totalOutstanding)}
              </div>
            </div>

            <div class="metric-card expense">
              <div class="metric-label">Total Commissions</div>
              <div class="metric-value">${formatCurrency(totalCommissions)}</div>
              <div class="metric-detail">
                Paid to sales agents
              </div>
            </div>

            <div class="metric-card revenue">
              <div class="metric-label">Revenue After Commissions</div>
              <div class="metric-value">${formatCurrency(revenueAfterCommissions)}</div>
              <div class="metric-detail">
                Sales - Commissions
              </div>
            </div>

            <div class="metric-card expense">
              <div class="metric-label">Total Expenses</div>
              <div class="metric-value">${formatCurrency(totalExpenses)}</div>
              <div class="metric-detail">
                Stock Purchases: ${formatCurrency(stockInExpenses)}<br/>
                Petty Cash: ${formatCurrency(pettyCashExpenses)}
              </div>
            </div>

            <div class="metric-card ${netIncome >= 0 ? 'profit' : 'loss'}">
              <div class="metric-label">Net Income</div>
              <div class="metric-value">${formatCurrency(netIncome)}</div>
              <div class="metric-detail">
                ${netIncome >= 0 ? '📈 Profitable' : '📉 Loss'}
              </div>
            </div>

            <div class="metric-card margin">
              <div class="metric-label">Profit Margin</div>
              <div class="metric-value">${profitMargin.toFixed(1)}%</div>
              <div class="metric-detail">
                ${profitMargin >= 20 ? '✅ Healthy' : profitMargin >= 10 ? '⚠️ Moderate' : '❌ Low'}
              </div>
            </div>
          </div>

          <!-- Sales Transactions -->
          <div class="section">
            <h3 class="section-title">Sales Transactions (${filteredSales.length})</h3>
            
            ${filteredSales.length === 0 ? '<p style="text-align: center; color: #94a3b8; padding: 20px;">No sales recorded in this period</p>' : `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sale #</th>
                    <th>Customer</th>
                    <th class="text-right">Total</th>
                    <th class="text-right">Commission</th>
                    <th class="text-right">Paid</th>
                    <th class="text-right">Balance</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredSales.map(sale => `
                    <tr>
                      <td>${format(new Date(sale.saleDate), 'MMM dd, yyyy')}</td>
                      <td>${sale.saleNumber}</td>
                      <td>${sale.customerName}</td>
                      <td class="text-right">${formatCurrency(sale.total)}</td>
                      <td class="text-right">${sale.commissionAmount ? formatCurrency(sale.commissionAmount) : '-'}</td>
                      <td class="text-right">${formatCurrency(sale.amountPaid)}</td>
                      <td class="text-right">${formatCurrency(sale.balance)}</td>
                      <td class="text-center">
                        <span class="status-badge status-${sale.paymentStatus}">
                          ${sale.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          <!-- Expense Receipts -->
          <div class="section">
            <h3 class="section-title">Expense Receipts (${filteredReceipts.length})</h3>
            
            ${filteredReceipts.length === 0 ? '<p style="text-align: center; color: #94a3b8; padding: 20px;">No expenses recorded in this period</p>' : `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference #</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredReceipts.map(receipt => `
                    <tr>
                      <td>${format(new Date(receipt.date), 'MMM dd, yyyy')}</td>
                      <td>${receipt.referenceNo}</td>
                      <td>
                        <span class="type-badge type-${receipt.type === 'in' ? 'in' : receipt.type === 'out' ? 'out' : 'petty'}">
                          ${receipt.type === 'in' ? 'Stock In' : receipt.type === 'out' ? 'Stock Out' : 'Petty Cash'}
                        </span>
                      </td>
                      <td>
                        ${receipt.type === 'petty_cash' 
                          ? `${receipt.pettyCashItems?.length || 0} expense items${receipt.payee ? ` • ${receipt.payee}` : ''}`
                          : `${receipt.items.length} material items`
                        }
                      </td>
                      <td class="text-right">${formatCurrency(receipt.grandTotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          <div class="footer">
            <p><strong>Report Generated:</strong> ${format(new Date(), 'PPP p')}</p>
            <p>JJB Furniture - Sales & Financial Report</p>
            <p style="margin-top: 10px; font-size: 7pt; color: #94a3b8;">
              This report is for internal use only. All financial data is confidential.
            </p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Print Financial Report
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Sales & Financial Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Report Period</Label>
            <Select value={reportPeriod} onValueChange={v => setReportPeriod(v as ReportPeriod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(reportPeriod === 'monthly' || reportPeriod === 'weekly') && (
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {reportPeriod === 'weekly' && (
            <div className="space-y-2">
              <Label>Week</Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map(week => (
                    <SelectItem key={week.value} value={week.value}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handlePrintReport} className="w-full mt-4">
            <Printer className="mr-2 h-4 w-4" />
            Generate & Print Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}