import { useState, useEffect } from 'react';
import { RawMaterial, StockTransaction, Worker, SofaModel } from '@/types/inventory';

const MATERIALS_KEY = 'inventory_materials';
const TRANSACTIONS_KEY = 'inventory_transactions';
const WORKERS_KEY = 'inventory_workers';
const SOFA_MODELS_KEY = 'inventory_sofa_models';

export function useInventory() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sofaModels, setSofaModels] = useState<SofaModel[]>([]);

  useEffect(() => {
    const savedMaterials = localStorage.getItem(MATERIALS_KEY);
    const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const savedWorkers = localStorage.getItem(WORKERS_KEY);
    const savedSofaModels = localStorage.getItem(SOFA_MODELS_KEY);
    
    if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    if (savedSofaModels) setSofaModels(JSON.parse(savedSofaModels));
  }, []);

  const saveMaterials = (newMaterials: RawMaterial[]) => {
    setMaterials(newMaterials);
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(newMaterials));
  };

  const saveTransactions = (newTransactions: StockTransaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
  };

  const saveWorkers = (newWorkers: Worker[]) => {
    setWorkers(newWorkers);
    localStorage.setItem(WORKERS_KEY, JSON.stringify(newWorkers));
  };

  const saveSofaModels = (newSofaModels: SofaModel[]) => {
    setSofaModels(newSofaModels);
    localStorage.setItem(SOFA_MODELS_KEY, JSON.stringify(newSofaModels));
  };

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

  // Workers CRUD
  const addWorker = (name: string) => {
    const newWorker: Worker = {
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

  // Sofa Models CRUD
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

  const logStock = (
    materialId: string, 
    type: 'in' | 'out', 
    quantity: number, 
    notes: string,
    workerId?: string,
    sofaModelId?: string
  ) => {
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
      notes,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      workerId,
      workerName: worker?.name,
      sofaModelId,
      sofaModelName: sofaModel?.name,
    };

    const newQuantity = type === 'in' 
      ? material.quantity + quantity 
      : material.quantity - quantity;

    updateMaterial(materialId, { quantity: Math.max(0, newQuantity) });
    saveTransactions([transaction, ...transactions]);
  };

  return {
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
    logStock,
  };
}
