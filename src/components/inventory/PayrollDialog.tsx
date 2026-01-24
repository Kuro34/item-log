// src/components/inventory/PayrollDialog.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Wallet, Eye, Trash2 } from 'lucide-react';
import { PayrollEntry } from '@/types/inventory';
import { format } from 'date-fns';

interface AddPayrollDialogProps {
  onAdd: (payroll: Omit<PayrollEntry, 'id' | 'createdAt'>) => void;
}

export function AddPayrollDialog({ onAdd }: AddPayrollDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = () => {
    if (amount && parseFloat(amount) > 0) {
      onAdd({
        amount: parseFloat(amount),
        description: description || 'Payroll Payment',
        date: date,
      });
      setAmount('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Wallet className="mr-2 h-4 w-4" />
          Add Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payroll Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Total Amount (₱) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Weekly payroll, Staff wages"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit} className="w-full">
              Add Payroll Payment
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PayrollHistoryDialogProps {
  payrollEntries: PayrollEntry[];
  onDelete: (id: string) => void;
}

export function PayrollHistoryDialog({ payrollEntries, onDelete }: PayrollHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  
  const totalPayroll = payrollEntries.reduce((sum, entry) => sum + entry.amount, 0);

  const formatCurrency = (value: number) => {
    return `₱ ${value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          View Payroll History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Payroll Payment History</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 mb-1">Total Payroll Expenses</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalPayroll)}</p>
          </div>

          {payrollEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payroll entries yet
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-md border">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payrollEntries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {format(new Date(entry.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm">{entry.description}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this payroll entry?')) {
                                onDelete(entry.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}