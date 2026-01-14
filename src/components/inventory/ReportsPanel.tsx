import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash,
} from 'lucide-react';
import { RawMaterial, StockTransaction, ReportPeriod, Employee, SofaModel } from '@/types/inventory';
import {
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isAfter,
  isBefore,
  isSameDay,
} from 'date-fns';

interface ReportsPanelProps {
  materials: RawMaterial[];
  transactions: StockTransaction[];
  workers: Employee[];
  sofaModels: SofaModel[];
  onEditTransaction?: (tx: StockTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export function ReportsPanel({
  materials,
  transactions,
  workers,
  sofaModels,
  onEditTransaction,
  onDeleteTransaction
}: ReportsPanelProps) {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [currentStart, setCurrentStart] = useState<Date>(new Date());
  const [editingTx, setEditingTx] = useState<StockTransaction | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const stockInRef = useRef<HTMLDivElement>(null);
  const stockOutRef = useRef<HTMLDivElement>(null);

  /* -------------------- Custom week helpers (month-based, Mon start, up to week 5) -------------------- */

  function getFirstMondayOfMonth(date: Date): Date {
    const first = startOfMonth(date);
    const weekday = first.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysToMonday = weekday === 1 ? 0 : (weekday === 0 ? 1 : 8 - weekday);
    return addDays(first, daysToMonday);
  }

  function getMonthWeekNumber(date: Date): number {
    const target = startOfDay(date);
    const firstMonday = getFirstMondayOfMonth(target);

    // Everything from the 1st up to and including the first Monday → week 1
    if (isBefore(target, firstMonday) || isSameDay(target, firstMonday)) {
      return 1;
    }

    const diffMs = target.getTime() - firstMonday.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(diffDays / 7) + 1;

    return Math.min(weekNum, 5);
  }

  function getMonthWeekStart(date: Date): Date {
    const weekNum = getMonthWeekNumber(date);
    const firstMonday = getFirstMondayOfMonth(date);
    if (weekNum <= 1) return firstMonday;
    return addDays(firstMonday, (weekNum - 1) * 7);
  }

  function getMonthWeekEnd(date: Date): Date {
    // Exclusive end (next Monday 00:00)
    return addDays(getMonthWeekStart(date), 7);
  }

  /* -------------------- Period calculation -------------------- */
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case 'daily':
      periodStart = startOfDay(currentStart);
      periodEnd = addDays(periodStart, 1);
      break;
    case 'weekly':
      periodStart = startOfDay(getMonthWeekStart(currentStart));
      periodEnd = getMonthWeekEnd(currentStart);
      break;
    case 'monthly':
      periodStart = startOfMonth(currentStart);
      periodEnd = addMonths(periodStart, 1);
      break;
    case 'yearly':
      periodStart = startOfYear(currentStart);
      periodEnd = addYears(periodStart, 1);
      break;
  }

  /* -------------------- Filtered data -------------------- */
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return isAfter(txDate, periodStart) && isBefore(txDate, periodEnd);
  });

  const stockIn = filteredTransactions.filter(tx => tx.type === 'in');
  const stockOut = filteredTransactions.filter(tx => tx.type === 'out');

  const totalIn = stockIn.reduce((sum, tx) => sum + tx.quantity, 0);
  const totalOut = stockOut.reduce((sum, tx) => sum + tx.quantity, 0);
  const totalInventoryValue = materials.reduce(
    (sum, m) => sum + m.quantity * m.costPerUnit,
    0
  );

  const totalSofas = filteredTransactions.reduce((sum, tx) => {
    if (!tx.notes) return sum;
    const matches = String(tx.notes).match(/\d+/g);
    if (!matches) return sum;
    return sum + matches.map(Number).reduce((a, b) => a + b, 0);
  }, 0);

  /* -------------------- Navigation -------------------- */
  const goPrevious = () => {
    setCurrentStart(prev => {
      if (period === 'daily') return addDays(prev, -1);
      if (period === 'weekly') {
        const weekStart = getMonthWeekStart(prev);
        return addDays(weekStart, -7);
      }
      if (period === 'monthly') return addMonths(prev, -1);
      return addYears(prev, -1);
    });
  };

  const goNext = () => {
    setCurrentStart(prev => {
      if (period === 'daily') return addDays(prev, 1);
      if (period === 'weekly') {
        const weekStart = getMonthWeekStart(prev);
        return addDays(weekStart, 7);
      }
      if (period === 'monthly') return addMonths(prev, 1);
      return addYears(prev, 1);
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentStart(new Date(e.target.value));
  };

  /* -------------------- Actions -------------------- */
  const handleEditTransaction = (e: React.MouseEvent, tx: StockTransaction) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTx(tx);
  };

  const handleSaveEdit = () => {
    if (editingTx && onEditTransaction) {
      onEditTransaction(editingTx);
      setEditingTx(null);
    }
  };

  const handleDeleteTransaction = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this transaction?\n\n⚠ Stock quantity will be reverted.')) return;
    onDeleteTransaction?.(id);
  };

  /* -------------------- Labels -------------------- */
  const periodLabel = () => {
    switch (period) {
      case 'daily':
        return format(periodStart, 'PPP');
      case 'weekly': {
        const wStart = getMonthWeekStart(periodStart);
        const wEnd = addDays(wStart, 6); // inclusive Sunday
        const weekNum = getMonthWeekNumber(periodStart);
        return `Week ${weekNum} (${format(wStart, 'MMM dd')} - ${format(wEnd, 'MMM dd')})`;
      }
      case 'monthly':
        return format(periodStart, 'MMMM yyyy');
      case 'yearly':
        return format(periodStart, 'yyyy');
    }
  };

  const getPrintDate = () => format(new Date(), 'yyyy-MM-dd');

  /* -------------------- Print Helpers -------------------- */
  const createPrintWindow = (title: string, contentHtml: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            .text-right { text-align: right; }
            h1 { margin-bottom: 0.5rem; }
            p.subtitle { color: #666; margin-bottom: 2rem; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
            .summary-card { border: 1px solid #e5e7eb; padding: 1.25rem; border-radius: 8px; background: white; }
            .summary-title { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
            .summary-value { font-size: 1.75rem; font-weight: bold; }
            .positive { color: #15803d; }
            .negative { color: #dc2626; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="subtitle">Period: ${periodLabel()}</p>
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintCombined = () => {
    if (!reportRef.current) return;
    createPrintWindow('Combined Inventory Report', reportRef.current.innerHTML);
  };

  const handlePrintStockIn = () => {
    const content = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-title">Total Stock In</div>
          <div class="summary-value">${totalIn}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Net Change</div>
          <div class="summary-value positive">+${totalIn}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Total Sofas Made</div>
          <div class="summary-value">${totalSofas}</div>
        </div>
      </div>
      <div class="card">
        <h2 style="margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 600;">Stock In Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Material</th>
              <th class="text-right">Quantity</th>
              <th>Worker</th>
              <th>Sofa Model</th>
              <th>Sofa Made</th>
            </tr>
          </thead>
          <tbody>
            ${stockIn.map(tx => `
              <tr>
                <td>${format(new Date(tx.date), 'MMM dd, yyyy HH:mm')}</td>
                <td>${tx.materialName}</td>
                <td class="text-right">${tx.quantity}</td>
                <td>${tx.workerName || '-'}</td>
                <td>${tx.sofaModelName || '-'}</td>
                <td>${tx.notes || '-'}</td>
              </tr>
            `).join('')}
            ${stockIn.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#6b7280;">No stock in transactions in this period</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    createPrintWindow(`Stock In Report ${getPrintDate()}`, content);
  };

  const handlePrintStockOut = () => {
    const content = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-title">Total Stock Out</div>
          <div class="summary-value">${totalOut}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Net Change</div>
          <div class="summary-value negative">-${totalOut}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Total Sofas Made</div>
          <div class="summary-value">${totalSofas}</div>
        </div>
      </div>
      <div class="card">
        <h2 style="margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 600;">Stock Out Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Material</th>
              <th class="text-right">Quantity</th>
              <th>Worker</th>
              <th>Sofa Model</th>
              <th>Sofa Made</th>
            </tr>
          </thead>
          <tbody>
            ${stockOut.map(tx => `
              <tr>
                <td>${format(new Date(tx.date), 'MMM dd, yyyy HH:mm')}</td>
                <td>${tx.materialName}</td>
                <td class="text-right">${tx.quantity}</td>
                <td>${tx.workerName || '-'}</td>
                <td>${tx.sofaModelName || '-'}</td>
                <td>${tx.notes || '-'}</td>
              </tr>
            `).join('')}
            ${stockOut.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#6b7280;">No stock out transactions in this period</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;
    createPrintWindow(`Stock Out Report ${getPrintDate()}`, content);
  };

  /* -------------------- Render -------------------- */
  return (
    <div className="space-y-4">
      {/* Edit Dialog */}
      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTx && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Material</Label>
                <Input value={editingTx.materialName} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Input value={editingTx.type === 'in' ? 'Stock In' : 'Stock Out'} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingTx.quantity}
                  onChange={(e) => setEditingTx({ ...editingTx, quantity: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Sofa Made / Notes</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingTx.notes || 0}
                  onChange={(e) => setEditingTx({ ...editingTx, notes: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={format(new Date(editingTx.date), 'yyyy-MM-dd')}
                  onChange={(e) => setEditingTx({ ...editingTx, date: `${e.target.value}T12:00:00.000Z` })}
                />
              </div>

              <Button onClick={handleSaveEdit} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
        <Tabs
          value={period}
          onValueChange={v => {
            setPeriod(v as ReportPeriod);
            setCurrentStart(new Date());
          }}
        >
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="date"
            value={format(currentStart, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="border rounded px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goPrevious}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={goNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={handlePrintCombined}>
              <Printer className="mr-2 h-4 w-4" /> Print Combined
            </Button>
            <Button size="sm" variant="secondary" onClick={handlePrintStockIn}>
              <Printer className="mr-2 h-4 w-4" /> Print Stock In
            </Button>
            <Button size="sm" variant="secondary" onClick={handlePrintStockOut}>
              <Printer className="mr-2 h-4 w-4" /> Print Stock Out
            </Button>
          </div>
        </div>
      </div>

      {/* Visible Screen Content (Combined) */}
      <div ref={reportRef}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalIn}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOut}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalIn - totalOut >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalIn - totalOut >= 0 ? '+' : ''}{totalIn - totalOut}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sofas Made</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSofas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({periodLabel()})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Sofa Model</TableHead>
                  <TableHead>Sofa Made</TableHead>
                  {period === 'daily' && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={period === 'daily' ? 8 : 7} className="text-center text-muted-foreground py-8">
                      No transactions in this period
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(tx.date), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">{tx.materialName}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{tx.quantity}</TableCell>
                      <TableCell>{tx.workerName || '-'}</TableCell>
                      <TableCell>{tx.sofaModelName || '-'}</TableCell>
                      <TableCell>{tx.notes || '-'}</TableCell>

                      {period === 'daily' && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={(e) => handleEditTransaction(e, tx)}
                              title="Edit transaction"
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={(e) => handleDeleteTransaction(e, tx.id)}
                              title="Delete transaction"
                              type="button"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}