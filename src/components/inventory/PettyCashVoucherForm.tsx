// src/components/inventory/PettyCashVoucherForm.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Plus, Printer, Trash } from 'lucide-react';
import { PettyCashItem } from '@/types/inventory';
import { useInventory } from '@/hooks/useInventory';
import { Textarea } from '@/components/ui/textarea';

const EXPENSE_CATEGORIES = [
  'Transportation',
  'Meals & Snacks',
  'Office Supplies',
  'Utilities',
  'Repairs & Maintenance',
  'Miscellaneous',
  'Other',
];

export function PettyCashVoucherForm() {
  const { addReceipt } = useInventory();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PettyCashItem[]>([]);
  const [payee, setPayee] = useState('');
  const [purpose, setPurpose] = useState('');
  const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [referenceNo, setReferenceNo] = useState(`PCV-${Date.now().toString().slice(-6)}`);

  const grandTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const formatCurrency = (value: number) => {
    if (value <= 0) return '—';
    return `₱ ${value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      description: '',
      category: 'Miscellaneous',
      amount: 0,
      remarks: ''
    }]);
  };

  const updateItem = (index: number, field: keyof PettyCashItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const canPrint = items.length > 0 && items.every(item => 
    item.description.trim() && item.amount > 0
  );

  const handlePrintVoucher = () => {
    if (!canPrint) {
      alert('Please add at least one expense item with description and amount > 0');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>PETTY CASH VOUCHER - ${referenceNo}</title>
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
            .info-full {
              grid-column: 1 / -1;
              margin: 0.4rem 0;
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
            .signature { 
              margin-top: 2rem; 
              display: flex; 
              justify-content: space-between; 
            }
            .sig-line { 
              width: 30%; 
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
            <p class="subtitle">PETTY CASH VOUCHER</p>
            <p class="subtitle">Ref No: ${referenceNo} • ${format(new Date(transactionDate), 'PPP')}</p>
          </div>

          <div class="info-grid">
            <div><span class="label">Payee:</span> <span class="value">${payee || '—'}</span></div>
            <div><span class="label">Date:</span> <span class="value">${format(new Date(transactionDate), 'PPP')}</span></div>
            ${purpose ? `<div class="info-full"><span class="label">Purpose:</span> <span class="value">${purpose}</span></div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Category</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>
                    ${item.description}
                    ${item.remarks ? `<br/><small style="color: #666; font-style: italic;">${item.remarks}</small>` : ''}
                  </td>
                  <td>${item.category}</td>
                  <td class="text-right">${formatCurrency(item.amount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">TOTAL AMOUNT</td>
                <td class="text-right">
                  ${formatCurrency(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="signature">
            <div class="sig-line">Requested by</div>
            <div class="sig-line">Approved by</div>
            <div class="sig-line">Received by</div>
          </div>

          <div class="footer">
            Printed on ${format(new Date(), 'PPP p')} • Petty Cash Voucher for Expense Tracking
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();

      // Save to receipts with type 'petty_cash'
      addReceipt({
        type: 'petty_cash',
        referenceNo,
        date: transactionDate,
        items: [],  // No material items
        pettyCashItems: items,
        grandTotal,
        payee,
        purpose,
      });

      // Reset form
      setItems([]);
      setPayee('');
      setPurpose('');
      setReferenceNo(`PCV-${Date.now().toString().slice(-6)}`);
      setOpen(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <DollarSign className="mr-2 h-4 w-4" /> Print Petty Cash Voucher
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Print Petty Cash Voucher</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Reference & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reference No</Label>
              <Input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="PCV-XXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} />
            </div>
          </div>

          {/* Payee & Purpose */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payee / Requester</Label>
              <Input value={payee} onChange={e => setPayee(e.target.value)} placeholder="Name of person" />
            </div>
            <div className="space-y-2">
              <Label>Purpose (optional)</Label>
              <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Brief description" />
            </div>
          </div>

          {/* Expense Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-background z-10 pb-2">
              <Label>Expense Items</Label>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" /> Add Expense
              </Button>
            </div>

            <div 
              className="max-h-[40vh] overflow-y-auto pr-2 border rounded-md bg-muted/20 p-2"
              style={{ scrollbarWidth: 'thin' }}
            >
              {items.length === 0 && (
                <p className="text-center text-muted-foreground py-10 text-sm">
                  No expense items added yet — click "Add Expense" to begin
                </p>
              )}

              {items.map((item, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-12 gap-3 border-b pb-4 mb-4 last:border-b-0 last:mb-0 bg-white rounded p-3 shadow-sm"
                >
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Description *</Label>
                    <Input
                      value={item.description}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                      placeholder="e.g., Taxi fare to supplier"
                      className="text-sm"
                    />
                  </div>

                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select value={item.category} onValueChange={v => updateItem(index, 'category', v)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Amount (₱) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount || ''}
                      onChange={e => updateItem(index, 'amount', Number(e.target.value))}
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>

                  <div className="col-span-1 flex items-end justify-center">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8">
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="col-span-12 space-y-1">
                    <Label className="text-xs">Remarks (optional)</Label>
                    <Textarea
                      value={item.remarks}
                      onChange={e => updateItem(index, 'remarks', e.target.value)}
                      placeholder="Additional notes..."
                      className="text-sm resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="flex justify-end text-base font-bold pt-2 border-t sticky bottom-0 bg-background z-10 py-2">
                Total Amount: {formatCurrency(grandTotal)}
              </div>
            )}
          </div>

          <Button
            onClick={handlePrintVoucher}
            className="w-full mt-2"
            disabled={!canPrint}
          >
            <Printer className="mr-2 h-4 w-4" /> Generate & Print Voucher
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}