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

interface SofaProduction {
  sofaModelId: string;
  quantity: number;
}

interface StockLogFormProps {
  materials: RawMaterial[];
  workers: Employee[];
  sofaModels: SofaModel[];
  onSubmit: (
    items: Array<{ materialId: string; quantity: number; workerId?: string; sofaModelId?: string; sofaDetails?: string }>,
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
  const [sofaProductions, setSofaProductions] = useState<SofaProduction[]>([{ sofaModelId: '', quantity: 0 }]);
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

  const addSofaProduction = () => {
    setSofaProductions(prev => [...prev, { sofaModelId: '', quantity: 0 }]);
  };

  const removeSofaProduction = (index: number) => {
    if (sofaProductions.length === 1) return;
    setSofaProductions(prev => prev.filter((_, i) => i !== index));
  };

  const updateSofaProduction = (index: number, field: 'sofaModelId' | 'quantity', value: string | number) => {
    setSofaProductions(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const customDate = transactionDate ? `${transactionDate}T12:00:00.000Z` : undefined;

    // Calculate total sofas made from all productions
    const totalSofasMade = sofaProductions
      .filter(sp => sp.sofaModelId && sp.quantity > 0)
      .reduce((sum, sp) => sum + sp.quantity, 0);

    // Create detailed string with sofa production details
    const sofaDetailsString = sofaProductions
      .filter(sp => sp.sofaModelId && sp.quantity > 0)
      .map(sp => {
        const model = sofaModels.find(m => m.id === sp.sofaModelId);
        return `${model?.name || 'Unknown'}: ${sp.quantity}`;
      })
      .join(' | ');

    const validItems = batchItems
      .filter(item => item.materialId && item.quantity > 0)
      .map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        workerId: isOut ? workerId || undefined : undefined,
        sofaModelId: isOut ? undefined : undefined, // Don't set single model for multi-model production
        sofaDetails: isOut && sofaDetailsString ? sofaDetailsString : undefined, // Store details string
      }));

    if (validItems.length === 0) return;

    // Pass total sofas made as notes, or the original notes field if not stock out
    onSubmit(validItems, type, isOut && totalSofasMade > 0 ? totalSofasMade : notes, customDate);

    setOpen(false);
    setBatchItems([{ materialId: '', quantity: 0 }]);
    setNotes(0);
    setWorkerId('');
    setSofaProductions([{ sofaModelId: '', quantity: 0 }]);
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
              <div className="space-y-4">
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

                {/* Sofa Production Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Sofa Models Produced</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSofaProduction}>
                      <Plus className="h-4 w-4 mr-2" /> Add Model
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 border rounded-md p-3 bg-blue-50/50">
                    {sofaProductions.map((production, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-end border-b pb-3 last:border-b-0 bg-white rounded p-2">
                        <div className="col-span-7 space-y-1">
                          <Label className="text-xs">Sofa Model</Label>
                          <Select
                            value={production.sofaModelId}
                            onValueChange={v => updateSofaProduction(index, 'sofaModelId', v)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                              {sofaModels.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-3 space-y-1">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            value={production.quantity || ''}
                            onChange={e => updateSofaProduction(index, 'quantity', Number(e.target.value))}
                            placeholder="0"
                            className="text-sm"
                          />
                        </div>

                        <div className="col-span-2 flex justify-end">
                          {sofaProductions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSofaProduction(index)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    Total sofas: <strong>{sofaProductions.reduce((sum, sp) => sum + (sp.quantity || 0), 0)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Remark / Sofa qty - only show for Stock In */}
            {!isOut && (
              <div className="space-y-2">
                <Label htmlFor="notes">Remark (optional)</Label>
                <Input
                  id="notes"
                  type="number"
                  min="0"
                  value={notes}
                  onChange={e => setNotes(Number(e.target.value))}
                  placeholder="Optional remark"
                />
              </div>
            )}

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