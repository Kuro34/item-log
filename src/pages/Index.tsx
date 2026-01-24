// src/pages/Index.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ArrowRightLeft, FileText, Users, ShoppingCart } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useSales } from '@/hooks/useSales';
import { MaterialForm } from '@/components/inventory/MaterialForm';
import MaterialsTable from '@/components/inventory/MaterialsTable';
import { StockLogForm } from '@/components/inventory/StockLogForm';
import { ReceiptLogForm } from '@/components/inventory/ReceiptLogForm';
import { PettyCashVoucherForm } from '@/components/inventory/PettyCashVoucherForm';
import { TransactionsTable } from '@/components/inventory/TransactionsTable';
import { ReportsPanel } from '@/components/inventory/ReportsPanel';
import { WorkersPanel } from '@/components/inventory/WorkersPanel';
import { SofaModelsPanel } from '@/components/inventory/SofaModelsPanel';
import { ReceiptsReport } from '@/components/inventory/ReceiptsReport';
import { SalesForm } from '@/components/sales/SalesForm';
import { CustomersPanel } from '@/components/sales/CustomersPanel';
import SalesReport from '@/components/sales/SalesReport';
import { SalesFinancialReport } from '@/components/sales/SalesFinancialReport';
import { useState } from 'react';
import { RawMaterial } from '@/types/inventory';

const Index = () => {
  const { 
    materials, 
    transactions, 
    workers,
    sofaModels,
    receipts,
    addMaterial, 
    updateMaterial, 
    deleteMaterial, 
    addWorker,
    updateWorker,
    deleteWorker,
    addSofaModel,
    updateSofaModel,
    deleteSofaModel,
    logStock,
    deleteTransactionWithRollback,
    editTransaction,
  } = useInventory();

  const {
    customers,
    sales,
    payments,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSale,
    updateSale,
    deleteSale,
    addPayment,
    deletePayment,
  } = useSales();

  const lowStockCount = materials.filter(m => m.quantity <= m.minStock).length;
  const totalValue = materials.reduce((sum, m) => sum + m.quantity * m.costPerUnit, 0);
  
  // Calculate total expenses (Stock In + Petty Cash)
  const stockInExpenses = receipts
    .filter(r => r.type === 'in')
    .reduce((sum, r) => sum + r.grandTotal, 0);
  
  const pettyCashExpenses = receipts
    .filter(r => r.type === 'petty_cash')
    .reduce((sum, r) => sum + r.grandTotal, 0);
  
  const totalExpenses = stockInExpenses + pettyCashExpenses;

  // Calculate sales metrics
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalSalesReceived = sales.reduce((sum, s) => sum + s.amountPaid, 0);
  const pendingSales = sales.filter(s => s.paymentStatus !== 'paid').length;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortCategory, setSortCategory] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">JJB Materials Inventory & Sales</h1>
          <p className="text-muted-foreground">Manage inventory, track stock, sales, and generate reports</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Materials</CardDescription>
              <CardTitle className="text-3xl">{materials.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Low Stock Alerts</CardDescription>
              <CardTitle className="text-3xl text-destructive">{lowStockCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inventory Value</CardDescription>
              <CardTitle className="text-2xl">
                ₱ {totalValue.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sales</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                ₱ {totalSalesRevenue.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Sales</CardDescription>
              <CardTitle className="text-3xl text-orange-600">{pendingSales}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="materials" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="materials" className="gap-2">
              <Package className="h-4 w-4" /> Materials
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" /> Reports
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-2">
              <FileText className="h-4 w-4" /> Receipts & Expenses
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <ShoppingCart className="h-4 w-4" /> Sales
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Users className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <MaterialForm
                key={editingMaterial?.id || 'new-material'}
                initialData={editingMaterial || undefined}
                onSubmit={(materialData) => {
                  if (editingMaterial) {
                    updateMaterial(editingMaterial.id, materialData);
                    setEditingMaterial(null);
                  } else {
                    addMaterial(materialData);
                  }
                }}
              />

              <StockLogForm 
                materials={materials} 
                workers={workers}
                sofaModels={sofaModels}
                onSubmit={logStock} 
                defaultType="in" 
              />
              <StockLogForm 
                materials={materials} 
                workers={workers}
                sofaModels={sofaModels}
                onSubmit={logStock} 
                defaultType="out" 
              />

              <ReceiptLogForm 
                materials={materials} 
                workers={workers} 
                sofaModels={sofaModels} 
                type="in" 
              />
              <ReceiptLogForm 
                materials={materials} 
                workers={workers} 
                sofaModels={sofaModels} 
                type="out" 
              />

              <PettyCashVoucherForm />
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              <input
                type="text"
                placeholder="Search materials..."
                className="border rounded px-3 py-2 text-sm w-full md:w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select
                className="border rounded px-3 py-2 text-sm"
                value={sortCategory}
                onChange={(e) => setSortCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {[...new Set(materials.map(m => m.category))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <MaterialsTable
              materials={materials
                .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .filter(m => sortCategory === '' || m.category === sortCategory)
              }
              onUpdate={(id) => {
                const mat = materials.find(m => m.id === id);
                if (mat) setEditingMaterial(mat);
              }}
              onDelete={deleteMaterial}
            />
          </TabsContent>
          
          <TabsContent value="transactions">
            <TransactionsTable transactions={transactions} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsPanel 
              materials={materials} 
              transactions={transactions}
              workers={workers}
              sofaModels={sofaModels}
              onEditTransaction={(tx) => editTransaction(tx.id, tx)}
              onDeleteTransaction={deleteTransactionWithRollback}
            />
          </TabsContent>

          <TabsContent value="receipts">
            <ReceiptsReport />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            {/* Financial Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardHeader className="pb-2">
                  <CardDescription className="text-green-700 dark:text-green-300">Total Sales Revenue</CardDescription>
                  <CardTitle className="text-3xl text-green-900 dark:text-green-100">
                    ₱ {totalSalesRevenue.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                <CardHeader className="pb-2">
                  <CardDescription className="text-red-700 dark:text-red-300">Total Expenses</CardDescription>
                  <CardTitle className="text-3xl text-red-900 dark:text-red-100">
                    ₱ {totalExpenses.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </CardTitle>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                    <div>Stock In: ₱{stockInExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                    <div>Petty Cash: ₱{pettyCashExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  </div>
                </CardHeader>
              </Card>

              <Card className={`bg-gradient-to-br border-2 ${
                totalSalesRevenue - totalExpenses >= 0
                  ? 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-300 dark:border-blue-700'
                  : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-300 dark:border-orange-700'
              }`}>
                <CardHeader className="pb-2">
                  <CardDescription className={
                    totalSalesRevenue - totalExpenses >= 0
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-orange-700 dark:text-orange-300'
                  }>
                    Net Income
                  </CardDescription>
                  <CardTitle className={`text-3xl ${
                    totalSalesRevenue - totalExpenses >= 0
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-orange-900 dark:text-orange-100'
                  }`}>
                    ₱ {(totalSalesRevenue - totalExpenses).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </CardTitle>
                  <div className={`text-xs mt-2 ${
                    totalSalesRevenue - totalExpenses >= 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {totalSalesRevenue - totalExpenses >= 0 ? '📈 Profit' : '📉 Loss'}
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-2">
                  <CardDescription className="text-purple-700 dark:text-purple-300">Profit Margin</CardDescription>
                  <CardTitle className="text-3xl text-purple-900 dark:text-purple-100">
                    {totalSalesRevenue > 0 
                      ? ((totalSalesRevenue - totalExpenses) / totalSalesRevenue * 100).toFixed(1)
                      : '0.0'
                    }%
                  </CardTitle>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    {totalSalesRevenue > 0
                      ? ((totalSalesRevenue - totalExpenses) / totalSalesRevenue * 100) >= 20
                        ? '✅ Healthy margin'
                        : ((totalSalesRevenue - totalExpenses) / totalSalesRevenue * 100) >= 10
                        ? '⚠️ Moderate margin'
                        : '❌ Low margin'
                      : 'No sales yet'
                    }
                  </div>
                </CardHeader>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <SalesForm
                customers={customers}
                sofaModels={sofaModels}
                materials={materials}
                onSubmit={(saleData) => {
                  // Add sale and handle material inventory reduction
                  addSale(saleData, (materialUpdates) => {
                    // Update material quantities
                    materialUpdates.forEach(({ id, quantityChange }) => {
                      const material = materials.find(m => m.id === id);
                      if (material) {
                        const newQuantity = Math.max(0, material.quantity + quantityChange);
                        updateMaterial(id, { 
                          quantity: newQuantity,
                          updatedAt: new Date().toISOString() 
                        });
                      }
                    });
                  });
                }}
              />
              
              <SalesFinancialReport
                sales={sales}
                receipts={receipts}
              />
            </div>

            <SalesReport
              sales={sales}
              payments={payments}
              onDelete={deleteSale}
              onAddPayment={addPayment}
              onDeletePayment={deletePayment}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <WorkersPanel 
                workers={workers}
                onAdd={addWorker}
                onUpdate={updateWorker}
                onDelete={deleteWorker}
              />
              <SofaModelsPanel 
                sofaModels={sofaModels}
                onAdd={addSofaModel}
                onUpdate={updateSofaModel}
                onDelete={deleteSofaModel}
              />
            </div>

            <CustomersPanel
              customers={customers}
              onAdd={addCustomer}
              onUpdate={updateCustomer}
              onDelete={deleteCustomer}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;