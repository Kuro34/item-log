import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StockTransaction } from '@/types/inventory';
import { format } from 'date-fns';

interface TransactionsTableProps {
  transactions: StockTransaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
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
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No transactions recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{format(new Date(tx.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                <TableCell className="font-medium">{tx.materialName}</TableCell>
                <TableCell>
                  <Badge variant={tx.type === 'in' ? 'default' : 'secondary'}>
                    {tx.type === 'in' ? 'Stock In' : 'Stock Out'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{tx.quantity}</TableCell>
                <TableCell>{tx.workerName || '-'}</TableCell>
                <TableCell>{tx.sofaModelName || '-'}</TableCell>
                <TableCell className="max-w-[200px] truncate">{tx.notes || '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
