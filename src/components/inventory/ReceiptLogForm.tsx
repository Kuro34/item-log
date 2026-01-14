import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownToLine, ArrowUpFromLine, Plus, Printer, Trash } from 'lucide-react';
import { RawMaterial, Employee, SofaModel } from '@/types/inventory';
import { useInventory } from '@/hooks/useInventory';

interface ReceiptItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  yardsPerRoll?: number;
  unitPrice: number;
  total: number;
}

interface ReceiptLogFormProps {
  materials: RawMaterial[];
  workers: Employee[];
  sofaModels: SofaModel[];
  type: 'in' | 'out';
}

export function ReceiptLogForm({ materials, workers, sofaModels, type }: ReceiptLogFormProps) {
  const { addReceipt } = useInventory();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [notes, setNotes] = useState(0);
  const [workerId, setWorkerId] = useState('');
  const [sofaModelId, setSofaModelId] = useState('');
  const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [referenceNo, setReferenceNo] = useState(`REC-${Date.now().toString().slice(-6)}`);

  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const formatCurrency = (value: number) => {
    if (value <= 0) return '—';
    return `₱ ${value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      materialId: '',
      materialName: '',
      quantity: 0,
      unit: 'pcs',
      yardsPerRoll: undefined,
      unitPrice: 0,
      total: 0
    }]);
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number | undefined) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;

      let updated = { ...item, [field]: value };

      // When material is selected/changed → always set name and defaults
      if (field === 'materialId' && value) {
        const mat = materials.find(m => m.id === value as string);
        if (mat) {
          updated.materialName = mat.name || 'Unknown Material';
          updated.unit = mat.unit || 'pcs';
          updated.unitPrice = mat.costPerUnit || 0;
          if (updated.unit.toLowerCase() !== 'roll') {
            updated.yardsPerRoll = undefined;
          }
        } else {
          updated.materialName = 'Unknown Material';
        }
      }

      // Recalculate total
      const qty = Number(updated.quantity) || 0;
      const price = Number(updated.unitPrice) || 0;

      if (updated.unit?.toLowerCase() === 'roll') {
        const yards = Number(updated.yardsPerRoll) || 1;
        updated.total = qty * yards * price;
      } else {
        updated.total = qty * price;
      }

      return updated;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const canPrint = items.length > 0 && items.every(item => 
    item.materialId && item.quantity > 0 && item.materialName
  );

  const handlePrintReceipt = () => {
    if (!canPrint) {
      alert('Please add at least one item with material, quantity > 0, and valid selection');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = type === 'in' ? 'STOCK IN RECEIPT' : 'STOCK OUT / ISSUE VOUCHER';
    const selectedWorker = workers.find(w => w.id === workerId);
    const selectedModel = sofaModels.find(s => s.id === sofaModelId);

    const hasAnyPrice = items.some(item => item.unitPrice > 0);
    const totalLabel = hasAnyPrice ? 'GRAND TOTAL' : 'TOTAL QUANTITY ONLY (no price entered)';

    const hasRollWithYards = items.some(i => i.unit?.toLowerCase() === 'roll' && (i.yardsPerRoll ?? 0) > 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ${referenceNo}</title>
          <style>
            @page { size: A5; margin: 12mm; }
            body { 
              font-family: 'Helvetica', Arial, sans-serif; 
              font-size: 9pt; 
              line-height: 1.3; 
              color: #111; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 1rem; 
              border-bottom: 1.5px solid #000; 
              padding-bottom: 0.6rem; 
            }
            .title { 
              font-size: 13pt; 
              font-weight: bold; 
              margin: 0; 
            }
            .subtitle { 
              font-size: 8.5pt; 
              color: #444; 
              margin: 0.2rem 0 0; 
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 0.6rem; 
              margin: 0.8rem 0; 
              font-size: 9pt; 
            }
            .label { font-weight: bold; color: #333; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 1rem 0; 
              font-size: 8pt; 
            }
            th, td { 
              border: 1px solid #888; 
              padding: 0.35rem 0.5rem; 
              text-align: left; 
            }
            th { 
              background: #f5f5f5; 
              font-weight: bold; 
              font-size: 8.5pt; 
            }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background: #f0f0f0; }
            .warning { 
              color: #d97706; 
              font-size: 8pt; 
              font-style: italic; 
              margin-top: 0.5rem; 
            }
            .signature { 
              margin-top: 2rem; 
              display: flex; 
              justify-content: space-between; 
            }
            .sig-line { 
              width: 45%; 
              border-top: 1px solid #000; 
              padding-top: 2rem; 
              text-align: center; 
              font-size: 8.5pt; 
            }
            .footer { 
              margin-top: 1.8rem; 
              text-align: center; 
              font-size: 7.5pt; 
              color: #666; 
              border-top: 1px solid #ccc; 
              padding-top: 0.6rem; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">JJB FURNITURE</h1>
            <p class="subtitle">${title}</p>
            <p class="subtitle">Ref No: ${referenceNo} • ${format(new Date(transactionDate), 'PPP')}</p>
          </div>

          <div class="info-grid">
            ${type === 'out' ? `
              <div><span class="label">Issued to:</span> <span class="value">${selectedWorker?.name || '—'}</span></div>
              <div><span class="label">Sofa Model:</span> <span class="value">${selectedModel?.name || '—'}</span></div>
              <div><span class="label">Sofas Produced:</span> <span class="value">${notes || 0}</span></div>
            ` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Material</th>
                <th>Unit</th>
                <th class="text-right">Qty</th>
                ${hasRollWithYards ? '<th class="text-right">Yards/Roll</th>' : ''}
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => {
                const priceDisplay = item.unitPrice > 0 
                  ? `₱ ${item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : '—';
                const totalDisplay = item.total > 0 
                  ? `₱ ${item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : '—';
                const showYardsColumn = hasRollWithYards;
                const yardsDisplay = item.unit?.toLowerCase() === 'roll' 
                  ? (item.yardsPerRoll ? item.yardsPerRoll : '—') 
                  : '';
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.materialName || 'Unknown Material'}</td>
                    <td>${item.unit}</td>
                    <td class="text-right">${item.quantity}</td>
                    ${showYardsColumn ? `<td class="text-right">${yardsDisplay}</td>` : ''}
                    <td class="text-right">${priceDisplay}</td>
                    <td class="text-right">${totalDisplay}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="${hasRollWithYards ? '6' : '5'}">${totalLabel}</td>
                <td class="text-right">
                  ${hasAnyPrice ? `₱ ${grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </td>
              </tr>
            </tbody>
          </table>

          ${!hasAnyPrice ? `
            <p class="warning mt-2">
              Note: No unit prices were entered — monetary total not calculated.
            </p>
          ` : ''}

          <div class="signature">
            <div class="sig-line">Prepared by / Receiver</div>
            <div class="sig-line">Approved by</div>
          </div>

          <div class="footer">
            Printed on ${format(new Date(), 'PPP p')} • Not a valid inventory adjustment • For documentation only
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();

      // Enrich items one final time before saving (safety net)
      const finalItems = items.map(item => {
        if (item.materialName) return item;
        const mat = materials.find(m => m.id === item.materialId);
        return {
          ...item,
          materialName: mat?.name || 'Unknown Material'
        };
      });

      addReceipt({
        type,
        referenceNo,
        date: transactionDate,
        items: finalItems,
        workerId: type === 'out' ? workerId : undefined,
        workerName: type === 'out' ? selectedWorker?.name : undefined,
        sofaModelId: type === 'out' ? sofaModelId : undefined,
        sofaModelName: type === 'out' ? selectedModel?.name : undefined,
        notes: type === 'out' ? notes : undefined,
        grandTotal,
      });

      setOpen(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {type === 'in' ? (
            <><ArrowDownToLine className="mr-2 h-4 w-4" /> Print Stock In Receipt</>
          ) : (
            <><ArrowUpFromLine className="mr-2 h-4 w-4" /> Print Stock Out Voucher</>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {type === 'in' ? 'Print Stock In Receipt' : 'Print Stock Out Voucher'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Reference & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reference No</Label>
              <Input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="REC-XXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} />
            </div>
          </div>

          {/* Only show worker/model/notes for Stock Out */}
          {type === 'out' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issued to (Worker)</Label>
                  <Select value={workerId} onValueChange={setWorkerId}>
                    <SelectTrigger><SelectValue placeholder="Select worker (optional)" /></SelectTrigger>
                    <SelectContent>{workers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sofa Model</Label>
                  <Select value={sofaModelId} onValueChange={setSofaModelId}>
                    <SelectTrigger><SelectValue placeholder="Select model (optional)" /></SelectTrigger>
                    <SelectContent>{sofaModels.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sofas Produced / Remark</Label>
                <Input type="number" min="0" value={notes} onChange={e => setNotes(Number(e.target.value))} placeholder="Optional" />
              </div>
            </>
          )}

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-background z-10 pb-2">
              <Label>Items</Label>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            <div 
              className="max-h-[40vh] overflow-y-auto pr-2 border rounded-md bg-muted/20 p-2"
              style={{ scrollbarWidth: 'thin' }}
            >
              {items.length === 0 && (
                <p className="text-center text-muted-foreground py-10 text-sm">
                  No items added yet — click "Add Item" to begin
                </p>
              )}

              {items.map((item, index) => {
                const isRoll = item.unit?.toLowerCase() === 'roll';

                return (
                  <div 
                    key={index} 
                    className="grid grid-cols-12 gap-3 border-b pb-4 mb-4 last:border-b-0 last:mb-0 bg-white rounded p-3 shadow-sm"
                  >
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Material</Label>
                      <Select value={item.materialId} onValueChange={v => updateItem(index, 'materialId', v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Input
                        value={item.unit}
                        onChange={e => updateItem(index, 'unit', e.target.value)}
                        placeholder="pcs / box / roll"
                        className="text-sm"
                      />
                    </div>

                    {isRoll && (
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Yards per Roll</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.yardsPerRoll ?? ''}
                          onChange={e => updateItem(index, 'yardsPerRoll', Number(e.target.value) || undefined)}
                          placeholder="e.g. 50 (optional)"
                          className="text-sm"
                        />
                      </div>
                    )}

                    <div className={`space-y-1 ${isRoll ? 'col-span-2' : 'col-span-2'}`}>
                      <Label className="text-xs">Unit Price (₱)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice || ''}
                        onChange={e => updateItem(index, 'unitPrice', Number(e.target.value))}
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>

                    <div className="col-span-1 flex items-end justify-center">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8">
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="col-span-12 text-right text-sm font-medium">
                      Line total: {formatCurrency(item.total)}
                    </div>
                  </div>
                );
              })}
            </div>

            {items.length > 0 && (
              <div className="flex justify-end text-base font-bold pt-2 border-t sticky bottom-0 bg-background z-10 py-2">
                Grand Total: {grandTotal > 0 ? formatCurrency(grandTotal) : '— (prices not entered)'}
              </div>
            )}
          </div>

          <Button
            onClick={() => { handlePrintReceipt(); setOpen(false); }}
            className="w-full mt-2"
            disabled={!canPrint}
          >
            <Printer className="mr-2 h-4 w-4" /> Generate & Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}