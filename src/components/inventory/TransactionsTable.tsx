// src/components/inventory/TransactionsTable.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StockTransaction } from '@/types/inventory';
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, isWithinInterval, addDays, addWeeks, addMonths } from 'date-fns';
import { Pencil, Trash, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface TransactionsTableProps {
  transactions: StockTransaction[];
  editable?: boolean;
  onEdit?: (tx: StockTransaction) => void;
  onDelete?: (id: string) => void;
}

type Period = 'daily' | 'weekly' | 'monthly';

export function TransactionsTable({
  transactions,
  editable = false,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [period, setPeriod] = useState<Period>('daily');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Get unique workers from all transactions
  const uniqueWorkers = Array.from(
    new Set(
      transactions
        .map(tx => tx.workerName)
        .filter(name => name != null && name !== '')
    )
  ).sort();

  // Calculate period range
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case 'daily':
      periodStart = startOfDay(currentDate);
      periodEnd = endOfDay(currentDate);
      break;
    case 'weekly':
      periodStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      periodEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      break;
    case 'monthly':
      periodStart = startOfMonth(currentDate);
      periodEnd = endOfMonth(currentDate);
      break;
  }

  // Filter transactions by period and worker
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const inPeriod = isWithinInterval(txDate, { start: periodStart, end: periodEnd });
    
    if (!inPeriod) return false;

    if (selectedWorker === 'all') return true;
    if (selectedWorker === 'none') return !tx.workerName;
    return tx.workerName === selectedWorker;
  });

  // Sort by date descending
  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate summary
  const stockInTotal = filteredTransactions
    .filter(tx => tx.type === 'in')
    .reduce((sum, tx) => sum + tx.quantity, 0);

  const stockOutTotal = filteredTransactions
    .filter(tx => tx.type === 'out')
    .reduce((sum, tx) => sum + tx.quantity, 0);

  const netChange = stockInTotal - stockOutTotal;

  // Navigation functions
  const goPrevious = () => {
    setCurrentDate(prev => {
      if (period === 'daily') return addDays(prev, -1);
      if (period === 'weekly') return addWeeks(prev, -1);
      return addMonths(prev, -1);
    });
    setCustomDate(format(
      period === 'daily' ? addDays(currentDate, -1) :
      period === 'weekly' ? addWeeks(currentDate, -1) :
      addMonths(currentDate, -1),
      'yyyy-MM-dd'
    ));
  };

  const goNext = () => {
    setCurrentDate(prev => {
      if (period === 'daily') return addDays(prev, 1);
      if (period === 'weekly') return addWeeks(prev, 1);
      return addMonths(prev, 1);
    });
    setCustomDate(format(
      period === 'daily' ? addDays(currentDate, 1) :
      period === 'weekly' ? addWeeks(currentDate, 1) :
      addMonths(currentDate, 1),
      'yyyy-MM-dd'
    ));
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setCustomDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setCurrentDate(newDate);
    setCustomDate(e.target.value);
  };

  // Period label
  const periodLabel = () => {
    switch (period) {
      case 'daily':
        return format(currentDate, 'EEEE, MMMM dd, yyyy');
      case 'weekly': {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `Week of ${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
      }
      case 'monthly':
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <Button variant="outline" size="sm" onClick={goToday}>
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
          </div>

          {/* Period Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={goPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Input
                type="date"
                value={customDate}
                onChange={handleDateChange}
                className="w-auto"
              />
            </div>
          </div>

          {/* Period Label and Worker Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              {periodLabel()}
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm">Filter by Worker:</Label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Workers</option>
                <option value="none">No Worker Assigned</option>
                {uniqueWorkers.map(worker => (
                  <option key={worker} value={worker}>
                    {worker}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          {filteredTransactions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">Stock In</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stockInTotal}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-xs text-red-600 dark:text-red-400 font-medium">Stock Out</div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stockOutTotal}</div>
              </div>
              <div className={`p-3 rounded-lg border ${
                netChange >= 0 
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                  : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
              }`}>
                <div className={`text-xs font-medium ${
                  netChange >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  Net Change
                </div>
                <div className={`text-2xl font-bold ${
                  netChange >= 0 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-orange-700 dark:text-orange-300'
                }`}>
                  {netChange >= 0 ? '+' : ''}{netChange}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Sofa Details</TableHead>
                <TableHead>Sofa Made</TableHead>
                {editable && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={editable ? 8 : 7} className="text-center text-muted-foreground py-8">
                    {selectedWorker === 'all' 
                      ? `No transactions recorded for this ${period} period.` 
                      : `No transactions found for ${selectedWorker === 'none' ? 'unassigned workers' : selectedWorker} in this ${period} period.`}
                  </TableCell>
                </TableRow>
              ) : (
                sortedTransactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">{format(new Date(tx.date), 'MMM dd, yyyy')}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(tx.date), 'HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{tx.materialName}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === 'in' ? 'default' : 'secondary'}>
                        {tx.type === 'in' ? 'Stock In' : 'Stock Out'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{tx.quantity}</TableCell>
                    <TableCell>{tx.workerName || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={tx.sofaModelName || '-'}>
                      {tx.sofaModelName || '-'}
                    </TableCell>
                    <TableCell>{tx.notes || '-'}</TableCell>

                    {editable && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" onClick={() => onEdit?.(tx)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => onDelete?.(tx.id)}
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
        </div>
        
        {selectedWorker !== 'all' && sortedTransactions.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''} 
            {selectedWorker === 'none' ? ' with no worker assigned' : ` for ${selectedWorker}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}