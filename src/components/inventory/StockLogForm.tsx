import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownToLine, ArrowUpFromLine, Calendar, Plus, Trash } from 'lucide-react';
import { RawMaterial, Employee, SofaModel } from '@/types/inventory';

interface BatchItem {
  materialId: string;
  quantity: number;
}

interface StockLogFormProps {
  materials: RawMaterial[];
  workers: Employee[];
  sofaModels: SofaModel[];
  onSubmit: (
    items: Array<{ materialId: string; quantity: number; workerId?: string; sofaModelId?: string }>,
    type: 'in' | 'out',
    notes: number,
    customDate?: string
  ) => void;
  defaultType?: 'in' | 'out';
}

export function StockLogForm({
  materials,
  workers,
  sofaModels,
  onSubmit,
  defaultType = 'in'
}: StockLogFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'in' | 'out'>(defaultType);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([{ materialId: '', quantity: 0 }]);
  const [notes, setNotes] = useState(0);
  const [workerId, setWorkerId] = useState('');
  const [sofaModelId, setSofaModelId] = useState('');
  const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const isOut = type === 'out';

  const addBatchItem = () => {
    setBatchItems(prev => [...prev, { materialId: '', quantity: 0 }]);
  };

  const removeBatchItem = (index: number) => {
    if (batchItems.length === 1) return;
    setBatchItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateBatchItem = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
    setBatchItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const customDate = transactionDate ? `${transactionDate}T12:00:00.000Z` : undefined;

    const validItems = batchItems
      .filter(item => item.materialId && item.quantity > 0)
      .map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        workerId: isOut ? workerId || undefined : undefined,
        sofaModelId: isOut ? sofaModelId || undefined : undefined,
      }));

    if (validItems.length === 0) return;

    onSubmit(validItems, type, notes, customDate);

    setOpen(false);
    setBatchItems([{ materialId: '', quantity: 0 }]);
    setNotes(0);
    setWorkerId('');
    setSofaModelId('');
    setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const isFormValid = batchItems.every(item => item.materialId && item.quantity > 0);

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
              Stock Out (Multi)
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {type === 'in' ? 'Log Stock In' : 'Log Multi-Material Stock Out'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={v => setType(v as 'in' | 'out')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In (single)</SelectItem>
                  <SelectItem value="out">Stock Out (multi)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Transaction Date</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Out-only shared fields */}
            {isOut && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Worker</Label>
                  <Select value={workerId} onValueChange={setWorkerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select worker (optional)" />
                    </SelectTrigger>
                    <SelectContent>
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
                      <SelectValue placeholder="Select model (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {sofaModels.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Remark / Sofa qty */}
            <div className="space-y-2">
              <Label htmlFor="notes">Sofa Quantity / Remark</Label>
              <Input
                id="notes"
                type="number"
                min="0"
                value={notes}
                onChange={e => setNotes(Number(e.target.value))}
                placeholder={isOut ? "Number of sofas made" : "Optional remark"}
              />
            </div>

            {/* Items input */}
            {isOut ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Materials to Stock Out</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBatchItem}>
                    <Plus className="h-4 w-4 mr-2" /> Add Material
                  </Button>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 border rounded-md p-3 bg-muted/20">
                  {batchItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end border-b pb-3 last:border-b-0">
                      <div className="col-span-6 space-y-1">
                        <Label className="text-xs">Material</Label>
                        <Select
                          value={item.materialId}
                          onValueChange={v => updateBatchItem(index, 'materialId', v)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} ({m.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-4 space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity || ''}
                          onChange={e => updateBatchItem(index, 'quantity', Number(e.target.value))}
                          className="text-sm"
                        />
                      </div>

                      <div className="col-span-2 flex justify-end">
                        {batchItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBatchItem(index)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select value={batchItems[0]?.materialId || ''} onValueChange={v => updateBatchItem(0, 'materialId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={batchItems[0]?.quantity || ''}
                    onChange={e => updateBatchItem(0, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full mt-4" disabled={!isFormValid}>
              {isOut ? 'Log Multi Stock Out' : 'Log Stock In'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}