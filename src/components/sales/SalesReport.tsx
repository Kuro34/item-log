// src/components/sales/SalesReport.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Printer, Trash, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Sale, Payment } from '@/types/sales';

interface SalesReportProps {
  sales: Sale[];
  payments: Payment[];
  onDelete: (id: string) => void;
  onAddPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  onDeletePayment: (id: string) => void;
}

export default function SalesReport({ sales, payments, onDelete, onAddPayment, onDeletePayment }: SalesReportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'bank_transfer'>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const filteredSales = sales
    .filter(s => 
      s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(s => filterStatus === 'all' || s.paymentStatus === filterStatus)
    .filter(s => !filterDateFrom || new Date(s.saleDate) >= new Date(filterDateFrom))
    .filter(s => !filterDateTo || new Date(s.saleDate) <= new Date(filterDateTo + 'T23:59:59.999Z'))
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalReceived = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalOutstanding = filteredSales.reduce((sum, s) => sum + s.balance, 0);

  const formatCurrency = (value: number) =>
    `₱ ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (status) {
      case 'paid': return `${baseClasses} bg-green-100 text-green-800`;
      case 'partial': return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'unpaid': return `${baseClasses} bg-red-100 text-red-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleAddPayment = () => {
    if (!selectedSale || paymentAmount <= 0) return;

    if (paymentAmount > selectedSale.balance) {
      alert('Payment amount cannot exceed remaining balance');
      return;
    }

    onAddPayment({
      saleId: selectedSale.id,
      saleNumber: selectedSale.saleNumber,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: paymentRef || undefined,
      notes: paymentNotes || undefined,
      date: new Date().toISOString(),
    });

    setPaymentDialogOpen(false);
    setPaymentAmount(0);
    setPaymentRef('');
    setPaymentNotes('');
  };

  const handlePrintSale = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sale Invoice - ${sale.saleNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 10pt; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .info { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background: #f0f0f0; }
            .summary { margin: 20px 0; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 9pt; }
            .badge-sofa { background: #dbeafe; color: #1e40af; }
            .badge-material { background: #dcfce7; color: #166534; }
            .text-muted { color: #666; font-size: 9pt; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>JJB FURNITURE</h1>
            <h2>SALES INVOICE</h2>
            <p>Invoice No: ${sale.saleNumber}</p>
          </div>

          <div class="info">
            <div class="info-row">
              <span><strong>Customer:</strong> ${sale.customerName}</span>
              <span><strong>Date:</strong> ${format(new Date(sale.saleDate), 'PPP')}</span>
            </div>
            ${sale.deliveryAddress ? `
              <div class="info-row">
                <span><strong>Delivery Address:</strong> ${sale.deliveryAddress}</span>
              </div>
            ` : ''}
            ${sale.deliveryDate ? `
              <div class="info-row">
                <span><strong>Delivery Date:</strong> ${format(new Date(sale.deliveryDate), 'PPP')}</span>
              </div>
            ` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th class="text-right">Qty</th>
                ${sale.items.some(i => i.type === 'material' && i.materialUnit?.toLowerCase() === 'roll') ? '<th class="text-right">Yards/Roll</th>' : ''}
                <th class="text-right">Unit Price</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map((item, idx) => {
                const isRoll = item.type === 'material' && item.materialUnit?.toLowerCase() === 'roll';
                const hasYardsColumn = sale.items.some(i => i.type === 'material' && i.materialUnit?.toLowerCase() === 'roll');
                const itemName = item.type === 'sofa' ? item.sofaModelName : item.materialName;
                const yardInfo = isRoll && item.yardsPerUnit ? `<br/><span class="text-muted">${item.quantity * item.yardsPerUnit} total yards</span>` : '';
                
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${itemName}${yardInfo}</td>
                    <td class="text-right">${item.quantity}</td>
                    ${hasYardsColumn ? `<td class="text-right">${isRoll && item.yardsPerUnit ? item.yardsPerUnit : '—'}</td>` : ''}
                    <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                    <td class="text-right">${formatCurrency(item.subtotal)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="info-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            <div class="info-row">
              <span>Discount:</span>
              <span>-${formatCurrency(sale.discount)}</span>
            </div>
            <div class="info-row">
              <span>Tax (${sale.tax}%):</span>
              <span>${formatCurrency(sale.taxAmount)}</span>
            </div>
            <div class="info-row" style="border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; font-size: 14pt;">
              <strong>TOTAL:</strong>
              <strong>${formatCurrency(sale.total)}</strong>
            </div>
            ${sale.commissions && sale.commissions.length > 0 ? `
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                <strong>Sales Commissions:</strong>
                ${sale.commissions.map(comm => `
                  <div class="info-row" style="margin-left: 15px;">
                    <span>${comm.agentName} (${comm.percent}%):</span>
                    <span>-${formatCurrency(comm.amount)}</span>
                  </div>
                `).join('')}
                <div class="info-row" style="border-top: 1px solid #ddd; margin-top: 8px; padding-top: 8px; font-size: 12pt; font-weight: bold; color: #0066cc;">
                  <span>NET TOTAL (after commission):</span>
                  <span>${formatCurrency(sale.netTotal)}</span>
                </div>
              </div>
            ` : ''}
            <div class="info-row">
              <span>Amount Paid:</span>
              <span style="color: green;">${formatCurrency(sale.amountPaid)}</span>
            </div>
            <div class="info-row">
              <span>Balance:</span>
              <span style="color: ${sale.balance > 0 ? 'red' : 'green'};">${formatCurrency(sale.balance)}</span>
            </div>
            <div class="info-row">
              <span>Payment Method:</span>
              <span>${sale.paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          ${sale.notes ? `
            <div style="margin-top: 20px;">
              <strong>Notes:</strong>
              <p>${sale.notes}</p>
            </div>
          ` : ''}

          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 9pt;">
            <p>Printed on ${format(new Date(), 'PPP p')}</p>
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Report</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Search</Label>
            <Input
              placeholder="Sale number or customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Label>Payment Status</Label>
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>From Date</Label>
            <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>To Date</Label>
            <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalSales)}</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800">Total Received</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalReceived)}</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-800">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(totalOutstanding)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No sales found
                </TableCell>
              </TableRow>
            ) : (
              paginatedSales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono">{sale.saleNumber}</TableCell>
                  <TableCell>{sale.customerName}</TableCell>
                  <TableCell>{format(new Date(sale.saleDate), 'PP')}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(sale.amountPaid)}</TableCell>
                  <TableCell className="text-right text-orange-600">{formatCurrency(sale.balance)}</TableCell>
                  <TableCell>
                    <span className={getStatusBadge(sale.paymentStatus)}>
                      {sale.paymentStatus.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedSale(sale)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {selectedSale && (
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Sale Details - {selectedSale.saleNumber}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Customer:</strong> {selectedSale.customerName}</div>
                                <div><strong>Date:</strong> {format(new Date(selectedSale.saleDate), 'PPP')}</div>
                                <div><strong>Payment Method:</strong> {selectedSale.paymentMethod.toUpperCase()}</div>
                                <div>
                                  <strong>Status:</strong>{' '}
                                  <span className={getStatusBadge(selectedSale.paymentStatus)}>
                                    {selectedSale.paymentStatus.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h3 className="font-semibold mb-2">Items</h3>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Sofa Model</TableHead>
                                      <TableHead className="text-right">Qty</TableHead>
                                      <TableHead className="text-right">Price</TableHead>
                                      <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {selectedSale.items.map((item, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{item.sofaModelName}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              <div className="bg-muted/50 p-4 rounded space-y-2">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Discount:</span>
                                  <span className="text-red-600">-{formatCurrency(selectedSale.discount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tax ({selectedSale.tax}%):</span>
                                  <span>{formatCurrency(selectedSale.taxAmount)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                  <span>Total:</span>
                                  <span>{formatCurrency(selectedSale.total)}</span>
                                </div>

                                {/* NEW: Commission section */}
                                {selectedSale.commissions && selectedSale.commissions.length > 0 && (
                                  <>
                                    <div className="border-t pt-2 mt-2">
                                      <h4 className="font-semibold text-sm mb-2">Sales Commissions</h4>
                                      {selectedSale.commissions.map((comm, idx) => (
                                        <div key={idx} className="flex justify-between text-sm ml-2">
                                          <span>{comm.agentName} ({comm.percent}%):</span>
                                          <span className="text-red-600">-{formatCurrency(comm.amount)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2 text-blue-600">
                                      <span>Net Total (after commission):</span>
                                      <span>{formatCurrency(selectedSale.netTotal)}</span>
                                    </div>
                                  </>
                                )}

                                <div className="flex justify-between text-green-600 border-t pt-2">
                                  <span>Amount Paid:</span>
                                  <span>{formatCurrency(selectedSale.amountPaid)}</span>
                                </div>
                                <div className="flex justify-between text-orange-600">
                                  <span>Balance:</span>
                                  <span>{formatCurrency(selectedSale.balance)}</span>
                                </div>
                              </div>

                              {selectedSale.balance > 0 && (
                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    setPaymentAmount(selectedSale.balance);
                                    setPaymentDialogOpen(true);
                                  }}
                                >
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Add Payment
                                </Button>
                              )}
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>

                      <Button variant="ghost" size="icon" onClick={() => handlePrintSale(sale)}>
                        <Printer className="h-4 w-4" />
                      </Button>

                      {sale.balance > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSale(sale);
                            setPaymentAmount(sale.balance);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </Button>
                      )}

                      <Button variant="ghost" size="icon" onClick={() => onDelete(sale.id)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <span>Page {currentPage} of {totalPages || 1}</span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 p-3 rounded text-sm">
                  <p><strong>Sale:</strong> {selectedSale.saleNumber}</p>
                  <p><strong>Customer:</strong> {selectedSale.customerName}</p>
                  <p><strong>Balance:</strong> {formatCurrency(selectedSale.balance)}</p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Amount (₱) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedSale.balance}
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reference Number (optional)</Label>
                  <Input
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="Check/Transfer reference"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="Additional notes"
                  />
                </div>

                <Button onClick={handleAddPayment} className="w-full" disabled={paymentAmount <= 0}>
                  Record Payment
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}