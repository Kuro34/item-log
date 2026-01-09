import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ArrowRightLeft, FileText, Users, Sofa } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { MaterialForm } from '@/components/inventory/MaterialForm';
import { MaterialsTable } from '@/components/inventory/MaterialsTable';
import { StockLogForm } from '@/components/inventory/StockLogForm';
import { TransactionsTable } from '@/components/inventory/TransactionsTable';
import { ReportsPanel } from '@/components/inventory/ReportsPanel';
import { WorkersPanel } from '@/components/inventory/WorkersPanel';
import { SofaModelsPanel } from '@/components/inventory/SofaModelsPanel';

const Index = () => {
  const { 
    materials, 
    transactions, 
    workers,
    sofaModels,
    addMaterial, 
    updateMaterial, 
    deleteMaterial, 
    addWorker,
    updateWorker,
    deleteWorker,
    addSofaModel,
    updateSofaModel,
    deleteSofaModel,
    logStock 
  } = useInventory();

  const lowStockCount = materials.filter(m => m.quantity <= m.minStock).length;
  const totalValue = materials.reduce((sum, m) => sum + m.quantity * m.costPerUnit, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Raw Materials Inventory</h1>
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
              <CardTitle className="text-3xl">${totalValue.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Workers</CardDescription>
              <CardTitle className="text-3xl">{workers.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="materials" className="space-y-4">
          <TabsList>
            <TabsTrigger value="materials" className="gap-2">
              <Package className="h-4 w-4" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Users className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            <div className="flex gap-2">
              <MaterialForm onSubmit={addMaterial} />
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
            </div>
            <MaterialsTable 
              materials={materials} 
              onUpdate={updateMaterial} 
              onDelete={deleteMaterial} 
            />
          </TabsContent>

          <TabsContent value="transactions">
            <div className="flex gap-2 mb-4">
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
            </div>
            <TransactionsTable transactions={transactions} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsPanel materials={materials} transactions={transactions} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
