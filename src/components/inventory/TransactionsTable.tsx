import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StockTransaction } from '@/types/inventory';
import { format } from 'date-fns';
import { Pencil, Trash } from 'lucide-react';

interface TransactionsTableProps {
  transactions: StockTransaction[];
  editable?: boolean;
  onEdit?: (tx: StockTransaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionsTable({
  transactions,
  editable = false,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  const [selectedWorker, setSelectedWorker] = useState<string>('all');

  // Get unique workers from all transactions
  const uniqueWorkers = Array.from(
    new Set(
      transactions
        .map(tx => tx.workerName)
        .filter(name => name != null && name !== '')
    )
  ).sort();

  // Filter transactions by selected worker
  const filteredTransactions = transactions.filter(tx => {
    if (selectedWorker === 'all') return true;
    if (selectedWorker === 'none') return !tx.workerName;
    return tx.workerName === selectedWorker;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Transactions</CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
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
                {editable && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={editable ? 8 : 7} className="text-center text-muted-foreground py-8">
                    {selectedWorker === 'all' 
                      ? 'No transactions recorded yet.' 
                      : `No transactions found for ${selectedWorker === 'none' ? 'unassigned workers' : selectedWorker}.`}
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
                      <Badge variant={tx.type === 'in' ? 'default' : 'secondary'}>
                        {tx.type === 'in' ? 'Stock In' : 'Stock Out'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{tx.quantity}</TableCell>
                    <TableCell>{tx.workerName || '-'}</TableCell>
                    <TableCell>{tx.sofaModelName || '-'}</TableCell>
                    <TableCell className="truncate max-w-[160px]">{tx.notes || '-'}</TableCell>

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
        
        {selectedWorker !== 'all' && filteredTransactions.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} 
            {selectedWorker === 'none' ? ' with no worker assigned' : ` for ${selectedWorker}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}