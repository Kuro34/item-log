import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer } from 'lucide-react';
import { RawMaterial, StockTransaction, ReportPeriod } from '@/types/inventory';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';

interface ReportsPanelProps {
  materials: RawMaterial[];
  transactions: StockTransaction[];
}

export function ReportsPanel({ materials, transactions }: ReportsPanelProps) {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const reportRef = useRef<HTMLDivElement>(null);

  const getStartDate = (period: ReportPeriod) => {
    const now = new Date();
    switch (period) {
      case 'daily': return startOfDay(now);
      case 'weekly': return startOfWeek(now);
      case 'monthly': return startOfMonth(now);
      case 'yearly': return startOfYear(now);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    isAfter(new Date(tx.date), getStartDate(period))
  );

  const stockIn = filteredTransactions.filter(tx => tx.type === 'in');
  const stockOut = filteredTransactions.filter(tx => tx.type === 'out');
  
  const totalIn = stockIn.reduce((sum, tx) => sum + tx.quantity, 0);
  const totalOut = stockOut.reduce((sum, tx) => sum + tx.quantity, 0);

  const totalInventoryValue = materials.reduce(
    (sum, m) => sum + m.quantity * m.costPerUnit, 0
  );

  const lowStockItems = materials.filter(m => m.quantity <= m.minStock);

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Inventory Report - ${period.charAt(0).toUpperCase() + period.slice(1)}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
            h1, h2, h3 { margin: 0 0 16px 0; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 16px 0; }
            .summary-card { padding: 16px; border: 1px solid #ddd; border-radius: 8px; }
            .summary-card h3 { font-size: 14px; color: #666; }
            .summary-card p { font-size: 24px; font-weight: bold; margin: 8px 0 0 0; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Inventory Report</h1>
          <p>Period: ${period.charAt(0).toUpperCase() + period.slice(1)} | Generated: ${format(new Date(), 'PPpp')}</p>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div ref={reportRef}>
        <div className="grid gap-4 md:grid-cols-4 summary">
          <Card className="summary-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{materials.length}</p>
            </CardContent>
          </Card>
          <Card className="summary-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stock In ({period})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">+{totalIn}</p>
            </CardContent>
          </Card>
          <Card className="summary-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stock Out ({period})</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">-{totalOut}</p>
            </CardContent>
          </Card>
          <Card className="summary-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {lowStockItems.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-destructive">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.quantity} {m.unit}</TableCell>
                      <TableCell>{m.minStock} {m.unit}</TableCell>
                      <TableCell>{m.supplier || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Current Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.category}</TableCell>
                    <TableCell className="text-right">{m.quantity}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell className="text-right">${(m.quantity * m.costPerUnit).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Transactions ({period})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No transactions in this period
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{format(new Date(tx.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell className="font-medium">{tx.materialName}</TableCell>
                      <TableCell>{tx.type === 'in' ? 'Stock In' : 'Stock Out'}</TableCell>
                      <TableCell className="text-right">{tx.quantity}</TableCell>
                      <TableCell>{tx.notes || '-'}</TableCell>
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
