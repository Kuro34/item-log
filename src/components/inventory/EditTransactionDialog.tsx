// src/components/inventory/EditTransactionDialog.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { StockTransaction, Employee, SofaModel } from '@/types/inventory';
import { format } from 'date-fns';

interface EditTransactionDialogProps {
  transaction: StockTransaction;
  workers: Employee[];
  sofaModels: SofaModel[];
  onEdit: (updated: Partial<StockTransaction>) => void;
}

export function EditTransactionDialog({
  transaction,
  workers,
  sofaModels,
  onEdit,
}: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(transaction.quantity);
  const [notes, setNotes] = useState(transaction.notes || 0);
  const [workerId, setWorkerId] = useState(transaction.workerId || '');
  const [sofaModelId, setSofaModelId] = useState(transaction.sofaModelId || '');
  const [date, setDate] = useState(format(new Date(transaction.date), 'yyyy-MM-dd'));

  const handleSave = () => {
    onEdit({
      quantity,
      notes,
      workerId: workerId || undefined,
      sofaModelId: sofaModelId || undefined,
      date: `${date}T12:00:00.000Z`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Sofa Quantity / Notes</Label>
            <Input
              type="number"
              min="0"
              value={notes}
              onChange={e => setNotes(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Worker</Label>
            <Select value={workerId} onValueChange={setWorkerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {workers.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sofa Model</Label>
            <Select value={sofaModelId} onValueChange={setSofaModelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {sofaModels.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}