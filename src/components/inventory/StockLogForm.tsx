import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { RawMaterial } from '@/types/inventory';

interface StockLogFormProps {
  materials: RawMaterial[];
  onSubmit: (materialId: string, type: 'in' | 'out', quantity: number, notes: string) => void;
  defaultType?: 'in' | 'out';
}

export function StockLogForm({ materials, onSubmit, defaultType = 'in' }: StockLogFormProps) {
  const [open, setOpen] = useState(false);
  const [materialId, setMaterialId] = useState('');
  const [type, setType] = useState<'in' | 'out'>(defaultType);
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId || quantity <= 0) return;
    onSubmit(materialId, type, quantity, notes);
    setOpen(false);
    setMaterialId('');
    setQuantity(0);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={defaultType === 'in' ? 'default' : 'secondary'}>
          {defaultType === 'in' ? (
            <>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Stock In
            </>
          ) : (
            <>
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Stock Out
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Stock {type === 'in' ? 'In' : 'Out'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.quantity} {m.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'in' | 'out')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
          <Button type="submit" className="w-full">
            Log Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
