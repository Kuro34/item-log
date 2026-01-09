import { useState, useEffect } from 'react';
import { RawMaterial, StockTransaction } from '@/types/inventory';

const MATERIALS_KEY = 'inventory_materials';
const TRANSACTIONS_KEY = 'inventory_transactions';

export function useInventory() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  useEffect(() => {
    const savedMaterials = localStorage.getItem(MATERIALS_KEY);
    const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    
    if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
  }, []);

  const saveMaterials = (newMaterials: RawMaterial[]) => {
    setMaterials(newMaterials);
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(newMaterials));
  };

  const saveTransactions = (newTransactions: StockTransaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
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

  const logStock = (materialId: string, type: 'in' | 'out', quantity: number, notes: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const transaction: StockTransaction = {
      id: crypto.randomUUID(),
      materialId,
      materialName: material.name,
      type,
      quantity,
      notes,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
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
    addMaterial,
    updateMaterial,
    deleteMaterial,
    logStock,
  };
}
