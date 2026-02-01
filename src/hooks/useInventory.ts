// src/hooks/useInventory.ts
import { useState, useEffect } from 'react';
import { RawMaterial, StockTransaction, Employee, SofaModel, Receipt, ReceiptItem, PettyCashItem, PayrollEntry } from '@/types/inventory';

const MATERIALS_KEY = 'inventory_materials';
const TRANSACTIONS_KEY = 'inventory_transactions';
const WORKERS_KEY = 'inventory_workers';
const SOFA_MODELS_KEY = 'inventory_sofa_models';
const RECEIPTS_KEY = 'inventory_receipts';
const PAYROLL_KEY = 'inventory_payroll';

// Re-export types for backward compatibility
export type { ReceiptItem, Receipt };
export type { PettyCashItem };
export type { PayrollEntry };

export function useInventory() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [workers, setWorkers] = useState<Employee[]>([]);
  const [sofaModels, setSofaModels] = useState<SofaModel[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);

  useEffect(() => {
    const savedMaterials   = localStorage.getItem(MATERIALS_KEY);
    const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const savedWorkers     = localStorage.getItem(WORKERS_KEY);
    const savedSofaModels  = localStorage.getItem(SOFA_MODELS_KEY);
    const savedReceipts    = localStorage.getItem(RECEIPTS_KEY);
    const savedPayroll     = localStorage.getItem(PAYROLL_KEY);

    if (savedMaterials)   setMaterials(JSON.parse(savedMaterials));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedWorkers)     setWorkers(JSON.parse(savedWorkers));
    if (savedSofaModels)  setSofaModels(JSON.parse(savedSofaModels));
    if (savedReceipts)    setReceipts(JSON.parse(savedReceipts));
    if (savedPayroll)     setPayrollEntries(JSON.parse(savedPayroll));
  }, []);

  const saveMaterials = (newMaterials: RawMaterial[]) => {
    setMaterials(newMaterials);
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(newMaterials));
  };

  const saveTransactions = (newTransactions: StockTransaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
  };

  const saveWorkers = (newWorkers: Employee[]) => {
    setWorkers(newWorkers);
    localStorage.setItem(WORKERS_KEY, JSON.stringify(newWorkers));
  };

  const saveSofaModels = (newSofaModels: SofaModel[]) => {
    setSofaModels(newSofaModels);
    localStorage.setItem(SOFA_MODELS_KEY, JSON.stringify(newSofaModels));
  };

  const saveReceipts = (newReceipts: Receipt[]) => {
    setReceipts(newReceipts);
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(newReceipts));
  };

  const savePayroll = (newPayroll: PayrollEntry[]) => {
    setPayrollEntries(newPayroll);
    localStorage.setItem(PAYROLL_KEY, JSON.stringify(newPayroll));
  };

  // ──────────────────────────────────────────────
  // Material CRUD
  // ──────────────────────────────────────────────

  const addMaterial = (material: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMaterial: RawMaterial = {
      ...material,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveMaterials([...materials, newMaterial]);
  };

  const updateMaterial = (id: string, updates: Partial<RawMaterial>) => {
    const updated = materials.map(m => 
      m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
    );
    saveMaterials(updated);
  };

  const deleteMaterial = (id: string) => {
    saveMaterials(materials.filter(m => m.id !== id));
  };

  // ──────────────────────────────────────────────
  // Worker & Sofa Model CRUD
  // ──────────────────────────────────────────────

  const addWorker = (name: string) => {
    const newWorker: Employee = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    saveWorkers([...workers, newWorker]);
  };

  const updateWorker = (id: string, name: string) => {
    saveWorkers(workers.map(w => w.id === id ? { ...w, name } : w));
  };

  const deleteWorker = (id: string) => {
    saveWorkers(workers.filter(w => w.id !== id));
  };

  const addSofaModel = (name: string) => {
    const newModel: SofaModel = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    saveSofaModels([...sofaModels, newModel]);
  };

  const updateSofaModel = (id: string, name: string) => {
    saveSofaModels(sofaModels.map(m => m.id === id ? { ...m, name } : m));
  };

  const deleteSofaModel = (id: string) => {
    saveSofaModels(sofaModels.filter(m => m.id !== id));
  };

  // ──────────────────────────────────────────────
  // Stock logging (batch support)
  // ──────────────────────────────────────────────

  const logStock = (
    items: Array<{
      materialId: string;
      quantity: number;
      workerId?: string;
      sofaModelId?: string;
      sofaDetails?: string; // ← Accept sofaDetails from the form
    }>,
    type: 'in' | 'out',
    notes: number = 0,
    customDate?: string | Date
  ) => {
    if (items.length === 0) return;

    const transactionDate = customDate
      ? new Date(customDate).toISOString()
      : new Date().toISOString();

    const newTransactions: StockTransaction[] = [];
    const materialUpdates: Record<string, number> = {};

    items.forEach(({ materialId, quantity, workerId, sofaModelId, sofaDetails }, index) => {
      const material = materials.find(m => m.id === materialId);
      if (!material) return;

      const worker = workerId ? workers.find(w => w.id === workerId) : undefined;
      const sofaModel = sofaModelId ? sofaModels.find(s => s.id === sofaModelId) : undefined;

      const transaction: StockTransaction = {
        id: crypto.randomUUID(),
        materialId,
        materialName: material.name,
        type,
        quantity,
        notes: index === 0 ? notes : undefined,
        date: transactionDate,
        createdAt: new Date().toISOString(),
        workerId,
        workerName: worker?.name,
        sofaModelId,
        sofaModelName: sofaModel?.name,
        sofaDetails, // ← Use the sofaDetails passed from the form
      };

      newTransactions.push(transaction);

      materialUpdates[materialId] = (materialUpdates[materialId] || 0) +
        (type === 'in' ? quantity : -quantity);
    });

    if (newTransactions.length === 0) return;

    const updatedMaterials = materials.map(m => {
      const delta = materialUpdates[m.id];
      if (delta === undefined) return m;
      return {
        ...m,
        quantity: Math.max(0, m.quantity + delta),
        updatedAt: new Date().toISOString(),
      };
    });

    saveTransactions([...transactions, ...newTransactions]);
    saveMaterials(updatedMaterials);
  };

  const deleteTransactionWithRollback = (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return;

    const material = materials.find(m => m.id === tx.materialId);
    if (!material) return;

    const rollbackQty = tx.type === 'in' ? -tx.quantity : tx.quantity;

    const updatedMaterials = materials.map(m =>
      m.id === material.id
        ? { ...m, quantity: Math.max(0, m.quantity + rollbackQty), updatedAt: new Date().toISOString() }
        : m
    );

    const updatedTransactions = transactions.filter(t => t.id !== transactionId);

    saveMaterials(updatedMaterials);
    saveTransactions(updatedTransactions);
  };

  const updateTransaction = (
    transactionId: string,
    updates: Partial<StockTransaction> & { quantity?: number; type?: 'in' | 'out' }
  ) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return;

    const material = materials.find(m => m.id === tx.materialId);
    if (!material) return;

    const oldRollback = tx.type === 'in' ? -tx.quantity : tx.quantity;
    let newMaterialQty = material.quantity + oldRollback;

    const newType = updates.type ?? tx.type;
    const newQty = updates.quantity ?? tx.quantity;
    newMaterialQty += newType === 'in' ? newQty : -newQty;

    const updatedMaterials = materials.map(m =>
      m.id === material.id
        ? { ...m, quantity: Math.max(0, newMaterialQty), updatedAt: new Date().toISOString() }
        : m
    );

    const updatedTransactions = transactions.map(t =>
      t.id === transactionId
        ? { ...t, ...updates, date: updates.date ? new Date(updates.date).toISOString() : t.date }
        : t
    );

    saveMaterials(updatedMaterials);
    saveTransactions(updatedTransactions);
  };

  // ──────────────────────────────────────────────
  // Receipt management
  // ──────────────────────────────────────────────

  const addReceipt = (receiptData: Omit<Receipt, 'id' | 'createdAt'>) => {
    const newReceipt: Receipt = {
      ...receiptData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveReceipts([...receipts, newReceipt]);
  };

  const deleteReceipt = (id: string) => {
    saveReceipts(receipts.filter(r => r.id !== id));
  };

  const editTransaction = (
    transactionId: string,
    newValues: Partial<StockTransaction> & {
      quantity?: number;
      type?: 'in' | 'out';
      notes?: number;
      workerId?: string;
      sofaModelId?: string;
      date?: string | Date;
    }
  ) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) {
      console.warn('Transaction not found');
      return;
    }

    const material = materials.find(m => m.id === tx.materialId);
    if (!material) {
      console.warn('Material not found');
      return;
    }

    const oldDelta = tx.type === 'in' ? -tx.quantity : tx.quantity;
    let updatedQty = material.quantity + oldDelta;

    const newType = newValues.type ?? tx.type;
    const newQuantity = newValues.quantity ?? tx.quantity;
    const newDelta = newType === 'in' ? newQuantity : -newQuantity;
    updatedQty += newDelta;

    // Update sofaDetails if sofaModelId or notes changed
    let updatedSofaDetails = tx.sofaDetails;
    if (newValues.sofaModelId !== undefined || newValues.notes !== undefined) {
      const newSofaModelId = newValues.sofaModelId ?? tx.sofaModelId;
      const newNotes = newValues.notes ?? tx.notes;
      const sofaModel = newSofaModelId ? sofaModels.find(s => s.id === newSofaModelId) : undefined;
      
      if (sofaModel) {
        updatedSofaDetails = sofaModel.name;
        if (newNotes && newNotes > 0) {
          updatedSofaDetails += ` (${newNotes} ${newNotes === 1 ? 'unit' : 'units'})`;
        }
      } else {
        updatedSofaDetails = undefined;
      }
    }

    const updatedMaterials = materials.map(m =>
      m.id === material.id
        ? { ...m, quantity: Math.max(0, updatedQty), updatedAt: new Date().toISOString() }
        : m
    );

    const updatedTransactions = transactions.map(t =>
      t.id === transactionId
        ? {
            ...t,
            ...newValues,
            sofaDetails: updatedSofaDetails,
            date: newValues.date ? new Date(newValues.date).toISOString() : t.date,
          }
        : t
    );

    saveMaterials(updatedMaterials);
    saveTransactions(updatedTransactions);
  };

  // ──────────────────────────────────────────────
  // NEW: Payroll management
  // ──────────────────────────────────────────────

  const addPayroll = (payrollData: Omit<PayrollEntry, 'id' | 'createdAt'>) => {
    const newPayroll: PayrollEntry = {
      ...payrollData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    savePayroll([...payrollEntries, newPayroll]);
  };

  const deletePayroll = (id: string) => {
    savePayroll(payrollEntries.filter(p => p.id !== id));
  };

  return {
    materials,
    transactions,
    workers,
    sofaModels,
    receipts,
    payrollEntries,
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
    updateTransaction,
    addReceipt,
    deleteReceipt,
    editTransaction,
    addPayroll,
    deletePayroll,
  };
}