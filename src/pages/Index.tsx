import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ArrowRightLeft, FileText, Users } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [sortCategory, setSortCategory] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">JJB Materials Inventory</h1>
          <p className="text-muted-foreground">Manage your inventory, track stock movements, and generate reports</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-4 mb-6">
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
              <CardDescription>Total Inventory Value</CardDescription>
              <CardTitle className="text-3xl">
                ₱ {totalValue.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Expenses</CardDescription>
              <CardTitle className="text-3xl text-amber-600">
                ₱ {totalExpenses.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </CardTitle>
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

              {/* NEW: Petty Cash Voucher Button */}
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;