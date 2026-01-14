// src/components/inventory/ReceiptsReport.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Printer, Trash, ChevronLeft, ChevronRight, Eye, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useInventory } from '@/hooks/useInventory';

export function ReceiptsReport() {
  const { receipts, deleteReceipt, materials } = useInventory();

  const [searchRef, setSearchRef] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out' | 'petty_cash'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<(typeof receipts)[number] | null>(null);

  const itemsPerPage = 10;

  // Filtered & sorted receipts — newest date first
  const filteredReceipts = receipts
    .filter((r) => r.referenceNo.toLowerCase().includes(searchRef.toLowerCase()))
    .filter((r) => filterType === 'all' || r.type === filterType)
    .filter((r) => !filterDateFrom || new Date(r.date) >= new Date(filterDateFrom))
    .filter((r) => !filterDateTo || new Date(r.date) <= new Date(filterDateTo + 'T23:59:59.999Z'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate expenses by type
  const stockInExpenses = filteredReceipts
    .filter((r) => r.type === 'in')
    .reduce((sum, r) => sum + r.grandTotal, 0);

  const pettyCashExpenses = filteredReceipts
    .filter((r) => r.type === 'petty_cash')
    .reduce((sum, r) => sum + r.grandTotal, 0);

  const totalExpenses = stockInExpenses + pettyCashExpenses;

  const formatCurrency = (value: number) =>
    `₱ ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Stock In';
      case 'out': return 'Stock Out';
      case 'petty_cash': return 'Petty Cash';
      default: return type.toUpperCase();
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (type) {
      case 'in': return `${baseClasses} bg-green-100 text-green-800`;
      case 'out': return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'petty_cash': return `${baseClasses} bg-amber-100 text-amber-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Helper to get suppliers from receipt items
  const getSuppliers = (receipt: typeof receipts[number]) => {
    if (receipt.type === 'petty_cash') return [];
    
    const suppliers = new Set<string>();
    receipt.items.forEach(item => {
      const material = materials.find(m => m.id === item.materialId);
      if (material?.supplier) {
        suppliers.add(material.supplier);
      }
    });
    return Array.from(suppliers);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipts & Expenses Report</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12pt; padding: 20px; }
            .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .summary h2 { margin: 0 0 10px 0; font-size: 14pt; }
            .summary-item { display: flex; justify-content: space-between; padding: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .text-right { text-align: right; }
            .total { font-weight: bold; font-size: 14pt; margin-top: 20px; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 10pt; }
            .badge-in { background: #d4edda; color: #155724; }
            .badge-out { background: #d1ecf1; color: #0c5460; }
            .badge-petty { background: #fff3cd; color: #856404; }
            .supplier-tag { font-size: 9pt; color: #666; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>Receipts & Expenses Report</h1>
          <p>Date Range: ${filterDateFrom || 'All'} to ${filterDateTo || 'All'}</p>
          <p>Type Filter: ${filterType === 'all' ? 'All Types' : getTypeLabel(filterType)}</p>

          <div class="summary">
            <h2>Expense Summary</h2>
            <div class="summary-item">
              <span>Stock In Purchases:</span>
              <strong>${formatCurrency(stockInExpenses)}</strong>
            </div>
            <div class="summary-item">
              <span>Petty Cash Expenses:</span>
              <strong>${formatCurrency(pettyCashExpenses)}</strong>
            </div>
            <div class="summary-item" style="border-top: 2px solid #333; margin-top: 10px; padding-top: 10px;">
              <span><strong>TOTAL EXPENSES:</strong></span>
              <strong style="font-size: 16pt;">${formatCurrency(totalExpenses)}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Ref No</th>
                <th>Type</th>
                <th>Date</th>
                <th>Details</th>
                <th>Supplier</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReceipts
                .map(
                  (r) => {
                    const badgeClass = r.type === 'in' ? 'badge-in' : r.type === 'out' ? 'badge-out' : 'badge-petty';
                    const suppliers = getSuppliers(r);
                    const supplierDisplay = suppliers.length > 0 ? suppliers.join(', ') : '—';
                    const details = r.type === 'petty_cash' 
                      ? `${r.pettyCashItems?.length || 0} expense items${r.payee ? ` • Payee: ${r.payee}` : ''}`
                      : `${r.items.length} material items`;
                    
                    return `
                      <tr>
                        <td>${r.referenceNo}</td>
                        <td><span class="badge ${badgeClass}">${getTypeLabel(r.type)}</span></td>
                        <td>${format(new Date(r.date), 'PPP')}</td>
                        <td>${details}</td>
                        <td>${supplierDisplay}</td>
                        <td class="text-right">${formatCurrency(r.grandTotal)}</td>
                      </tr>
                    `;
                  }
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer" style="margin-top: 30px; text-align: center; color: #666; font-size: 10pt;">
            <p>Printed on ${format(new Date(), 'PPP p')}</p>
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
        <CardTitle>Receipts Report & Expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Search Ref No</Label>
            <Input value={searchRef} onChange={(e) => setSearchRef(e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
                <SelectItem value="petty_cash">Petty Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>From Date</Label>
            <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>To Date</Label>
            <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
          </div>
        </div>

        {/* Expense Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800">Stock In Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stockInExpenses)}</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">Petty Cash Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-900">{formatCurrency(pettyCashExpenses)}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref No</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReceipts.map((r) => {
              const suppliers = getSuppliers(r);
              
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.referenceNo}</TableCell>
                  <TableCell>
                    <span className={getTypeBadge(r.type)}>
                      {getTypeLabel(r.type)}
                    </span>
                  </TableCell>
                  <TableCell>{format(new Date(r.date), 'PPP')}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.type === 'petty_cash' ? (
                      <>
                        {r.pettyCashItems?.length || 0} expense items
                        {r.payee && ` • ${r.payee}`}
                      </>
                    ) : (
                      <>
                        {r.items.length} material items
                        {suppliers.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            Supplier: {suppliers.join(', ')}
                          </div>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(r.grandTotal)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedReceipt(r)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {selectedReceipt && (
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {selectedReceipt.type === 'petty_cash' && <DollarSign className="h-5 w-5 text-amber-600" />}
                                {getTypeLabel(selectedReceipt.type)} – {selectedReceipt.referenceNo}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Date:</span>{' '}
                                  {format(new Date(selectedReceipt.date), 'PPP')}
                                </div>
                                <div>
                                  <span className="font-medium">Type:</span>{' '}
                                  <span className={getTypeBadge(selectedReceipt.type)}>
                                    {getTypeLabel(selectedReceipt.type)}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">Total:</span>{' '}
                                  {formatCurrency(selectedReceipt.grandTotal)}
                                </div>
                              </div>

                              {/* Show suppliers for stock receipts */}
                              {selectedReceipt.type !== 'petty_cash' && getSuppliers(selectedReceipt).length > 0 && (
                                <div className="bg-blue-50 p-3 rounded text-sm">
                                  <span className="font-medium">Supplier(s):</span>{' '}
                                  <span className="text-blue-700">
                                    {getSuppliers(selectedReceipt).join(', ')}
                                  </span>
                                </div>
                              )}

                              {selectedReceipt.type === 'petty_cash' ? (
                                <>
                                  {(selectedReceipt.payee || selectedReceipt.purpose) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded">
                                      {selectedReceipt.payee && (
                                        <div>
                                          <span className="font-medium">Payee:</span> {selectedReceipt.payee}
                                        </div>
                                      )}
                                      {selectedReceipt.purpose && (
                                        <div>
                                          <span className="font-medium">Purpose:</span> {selectedReceipt.purpose}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div>
                                    <h3 className="font-semibold mb-2">Expense Items</h3>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Description</TableHead>
                                          <TableHead>Category</TableHead>
                                          <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {selectedReceipt.pettyCashItems?.map((item, index) => (
                                          <TableRow key={index}>
                                            <TableCell>
                                              {item.description}
                                              {item.remarks && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                  {item.remarks}
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell className="text-right font-medium">
                                              {formatCurrency(item.amount)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <h3 className="font-semibold mb-2">Material Items</h3>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Material</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        {selectedReceipt.items.some(i => i.unit?.toLowerCase() === 'roll') && (
                                          <TableHead className="text-right">Yards/Roll</TableHead>
                                        )}
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedReceipt.items.map((item, index) => {
                                        const isRoll = item.unit?.toLowerCase() === 'roll';
                                        const material = materials.find(m => m.id === item.materialId);
                                        const displayName = item.materialName || material?.name || '—';

                                        return (
                                          <TableRow key={index}>
                                            <TableCell>
                                              {displayName}
                                              {material?.supplier && (
                                                <div className="text-xs text-blue-600 mt-1">
                                                  {material.supplier}
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            {selectedReceipt.items.some(i => i.unit?.toLowerCase() === 'roll') && (
                                              <TableCell className="text-right">
                                                {isRoll && item.yardsPerRoll ? item.yardsPerRoll : '—'}
                                              </TableCell>
                                            )}
                                            <TableCell className="text-right">
                                              {item.unitPrice > 0 ? formatCurrency(item.unitPrice) : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                              {item.total > 0 ? formatCurrency(item.total) : '—'}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteReceipt(r.id)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredReceipts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No receipts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>

          <span>Page {currentPage} of {totalPages || 1}</span>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Print Report Button */}
        <Button onClick={handlePrintReport} className="w-full">
          <Printer className="mr-2 h-4 w-4" /> Print Full Report
        </Button>
      </CardContent>
    </Card>
  );
}