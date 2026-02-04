// src/components/sales/SalesForm.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash, ShoppingCart } from 'lucide-react';
import { Customer, SaleItem, Agent } from '@/types/sales';     // ← make sure Agent is exported
import { SofaModel, RawMaterial } from '@/types/inventory';

interface SalesFormProps {
  customers: Customer[];
  sofaModels: SofaModel[];
  materials: RawMaterial[];
  agents: Agent[];                    // ← added
  onSubmit: (saleData: any) => void;
}

export function SalesForm({ 
  customers, 
  sofaModels, 
  materials, 
  agents, 
  onSubmit 
}: SalesFormProps) {
  const [open, setOpen] = useState(false);
  const [saleNumber, setSaleNumber] = useState(`SALE-${Date.now().toString().slice(-6)}`);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [taxRate, setTaxRate] = useState(12);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'bank_transfer' | 'installment'>('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [saleDate, setSaleDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // ── NEW: Commissions state ──
  const [commissions, setCommissions] = useState<Array<{ agentId: string; percent: number; agentName?: string }>>([]);

  const addItem = (type: 'sofa' | 'material' = 'sofa') => {
    setItems(prev => [...prev, {
      type,
      sofaModelId: type === 'sofa' ? '' : undefined,
      sofaModelName: type === 'sofa' ? '' : undefined,
      materialId: type === 'material' ? '' : undefined,
      materialName: type === 'material' ? '' : undefined,
      materialUnit: type === 'material' ? '' : undefined,
      quantity: 1,
      yardsPerUnit: undefined,
      unitPrice: 0,
      discount: 0,
      subtotal: 0,
    }]);
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;

      let updated = { ...item, [field]: value };

      if (field === 'sofaModelId' && value) {
        const model = sofaModels.find(m => m.id === value as string);
        if (model) updated.sofaModelName = model.name;
      }

      if (field === 'materialId' && value) {
        const material = materials.find(m => m.id === value as string);
        if (material) {
          updated.materialName = material.name;
          updated.materialUnit = material.unit;
          updated.unitPrice = material.costPerUnit || 0;
          if (material.unit?.toLowerCase() !== 'roll') {
            updated.yardsPerUnit = undefined;
          }
        }
      }

      const qty = Number(updated.quantity) || 0;
      const price = Number(updated.unitPrice) || 0;
      const disc = Number(updated.discount) || 0;

      let finalQty = qty;
      if (updated.type === 'material' && updated.materialUnit?.toLowerCase() === 'roll') {
        const yards = Number(updated.yardsPerUnit) || 1;
        finalQty = qty * yards;
      }

      updated.subtotal = finalQty * price * (1 - disc / 100);

      return updated;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // ── NEW: Commission handlers ──
  const addCommission = () => {
    setCommissions(prev => [...prev, { agentId: '', percent: 0 }]);
  };

  const updateCommission = (index: number, field: 'agentId' | 'percent', value: string | number) => {
    setCommissions(prev => prev.map((comm, i) => {
      if (i !== index) return comm;
      const updated = { ...comm, [field]: value };

      if (field === 'agentId' && value) {
        const agent = agents.find(a => a.id === value);
        if (agent) updated.agentName = agent.name;
      }

      return updated;
    }));
  };

  const removeCommission = (index: number) => {
    setCommissions(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  // ── NEW calculations ──
  const totalCommission = commissions.reduce(
    (sum, c) => sum + (total * (Number(c.percent) || 0) / 100),
    0
  );
  const netTotal = total - totalCommission;

  const balance = total - amountPaid;
  const paymentStatus = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || items.length === 0) {
      alert('Please select a customer and add at least one item');
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const validItems = items.filter(item => {
      if (item.type === 'sofa') return item.sofaModelId && item.quantity > 0;
      return item.materialId && item.quantity > 0;
    });

    if (validItems.length === 0) {
      alert('Please add valid items with selection and quantity > 0');
      return;
    }

    // Filter only valid commissions
    const validCommissions = commissions
      .filter(c => c.agentId && c.percent > 0)
      .map(c => ({
        agentId: c.agentId,
        agentName: c.agentName!,
        percent: c.percent,
        amount: total * (c.percent / 100),
      }));

    onSubmit({
      saleNumber,
      customerId,
      customerName: customer.name,
      items: validItems,
      subtotal,
      discount: discountAmount,
      tax: taxRate,
      taxAmount,
      total,
      // ── NEW fields added to submission ──
      commissions: validCommissions,
      commissionAmount: totalCommission,
      netTotal,
      paymentMethod,
      paymentStatus,
      amountPaid,
      balance,
      notes,
      deliveryAddress,
      deliveryDate: deliveryDate || undefined,
      saleDate: `${saleDate}T12:00:00.000Z`,
    });

    // Reset form
    setOpen(false);
    setSaleNumber(`SALE-${Date.now().toString().slice(-6)}`);
    setCustomerId('');
    setItems([]);
    setDiscount(0);
    setAmountPaid(0);
    setNotes('');
    setDeliveryAddress('');
    setDeliveryDate('');
    setSaleDate(format(new Date(), 'yyyy-MM-dd'));
    setCommissions([]);                    // reset commissions too
  };

  const formatCurrency = (value: number) =>
    `₱ ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ShoppingCart className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sale</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Sale Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Sale Number</Label>
              <Input value={saleNumber} onChange={e => setSaleNumber(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sale Date</Label>
              <Input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} required />
            </div>
          </div>

          {/* Items Section – unchanged */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Sale Items</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addItem('sofa')}>
                  <Plus className="h-4 w-4 mr-2" /> Add Sofa
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addItem('material')}>
                  <Plus className="h-4 w-4 mr-2" /> Add Material
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto border rounded-md p-3 bg-muted/20">
              {items.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No items added yet — click "Add Sofa" or "Add Material" to begin
                </p>
              )}

              {items.map((item, index) => {
                const isRoll = item.type === 'material' && item.materialUnit?.toLowerCase() === 'roll';

                return (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded border">
                    <div className="col-span-1 space-y-1">
                      <Label className="text-xs">Type</Label>
                      <div className={`text-xs font-medium px-2 py-1.5 rounded border text-center ${
                        item.type === 'sofa' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {item.type === 'sofa' ? 'Sofa' : 'Material'}
                      </div>
                    </div>

                    <div className={`space-y-1 ${isRoll ? 'col-span-3' : 'col-span-4'}`}>
                      <Label className="text-xs">
                        {item.type === 'sofa' ? 'Sofa Model *' : 'Material *'}
                      </Label>
                      {item.type === 'sofa' ? (
                        <Select value={item.sofaModelId || ''} onValueChange={v => updateItem(index, 'sofaModelId', v)}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select sofa model" />
                          </SelectTrigger>
                          <SelectContent>
                            {sofaModels.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select value={item.materialId || ''} onValueChange={v => updateItem(index, 'materialId', v)}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} ({m.quantity} {m.unit} available)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Qty *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>

                    {isRoll && (
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Yards/Roll</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.yardsPerUnit ?? ''}
                          onChange={e => updateItem(index, 'yardsPerUnit', Number(e.target.value) || undefined)}
                          placeholder="e.g., 50"
                          className="text-sm"
                        />
                      </div>
                    )}

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Unit Price (₱)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice || ''}
                        onChange={e => updateItem(index, 'unitPrice', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>

                    <div className={`space-y-1 ${isRoll ? 'col-span-1' : 'col-span-2'}`}>
                      <Label className="text-xs">Disc %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.discount || ''}
                        onChange={e => updateItem(index, 'discount', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>

                    <div className="col-span-1 flex items-end justify-center">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="col-span-12 text-right text-sm">
                      {isRoll && item.yardsPerUnit && (
                        <span className="text-muted-foreground mr-3">
                          ({item.quantity} rolls × {item.yardsPerUnit} yards = {item.quantity * item.yardsPerUnit} yards)
                        </span>
                      )}
                      <span className="font-medium">Subtotal: {formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── NEW: Agents / Commissions Section ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Sales Agents / Commissions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCommission}>
                <Plus className="h-4 w-4 mr-2" /> Add Agent
              </Button>
            </div>

            <div className="space-y-3 max-h-[30vh] overflow-y-auto border rounded-md p-3 bg-muted/20">
              {commissions.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No agents added — click "Add Agent" to assign commission
                </p>
              )}

              {commissions.map((comm, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded border">
                  <div className="col-span-6 space-y-1">
                    <Label className="text-xs">Agent *</Label>
                    <Select
                      value={comm.agentId}
                      onValueChange={v => updateCommission(index, 'agentId', v)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Commission %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={comm.percent || ''}
                      onChange={e => updateCommission(index, 'percent', Number(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>

                  <div className="col-span-2 flex items-end justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCommission(index)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="col-span-12 text-right text-sm font-medium">
                    Commission: {formatCurrency(total * (comm.percent || 0) / 100)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary – updated with commission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Overall Discount (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tax Rate (%) - VAT</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxRate}
                  onChange={e => setTaxRate(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="installment">Installment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount Paid (₱)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountPaid}
                  onChange={e => setAmountPaid(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3 bg-muted/50 p-4 rounded">
              <h3 className="font-semibold mb-3">Sale Summary</h3>
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount ({discount}%):</span>
                <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({taxRate}%):</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>

              {/* NEW */}
              <div className="flex justify-between text-sm">
                <span>Total Commission:</span>
                <span className="font-medium text-red-600">-{formatCurrency(totalCommission)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Net Total:</span>
                <span className="text-blue-600">{formatCurrency(netTotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Amount Paid:</span>
                <span className="font-medium text-green-600">{formatCurrency(amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Balance:</span>
                <span className={`font-medium ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className={`font-medium px-2 py-1 rounded text-xs ${
                  paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  paymentStatus === 'partial' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delivery Address (optional)</Label>
              <Textarea
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expected Delivery Date (optional)</Label>
            <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={items.length === 0 || !customerId}>
            Create Sale
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}