import { openDB } from 'idb';

let db: any;

export const initDB = async () => {
  db = await openDB('item-log', 2, {
    upgrade(db: any) {
      // Items
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
      }

      // Materials
      if (!db.objectStoreNames.contains('materials')) {
        db.createObjectStore('materials', { keyPath: 'id', autoIncrement: true });
      }

      // Sofa Models
      if (!db.objectStoreNames.contains('sofaModels')) {
        db.createObjectStore('sofaModels', { keyPath: 'id', autoIncrement: true });
      }

      // Workers
      if (!db.objectStoreNames.contains('workers')) {
        db.createObjectStore('workers', { keyPath: 'id', autoIncrement: true });
      }

      // Stock Logs
      if (!db.objectStoreNames.contains('stockLogs')) {
        const store = db.createObjectStore('stockLogs', { keyPath: 'id', autoIncrement: true });
        store.createIndex('materialId', 'materialId', { unique: false });
      }

      // Transactions
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  return db;
};

// Items
export const addItem = async (item: any) => db.add('items', { ...item, id: Date.now() });
export const getItems = async () => db.getAll('items');
export const deleteItem = async (id: number) => db.delete('items', id);
export const updateItem = async (id: number, item: any) => {
  const existing = await db.get('items', id);
  return db.put('items', { ...existing, ...item, id });
};

// Materials
export const addMaterial = async (material: any) => db.add('materials', { ...material, id: Date.now() });
export const getMaterials = async () => db.getAll('materials');
export const deleteMaterial = async (id: number) => db.delete('materials', id);
export const updateMaterial = async (id: number, material: any) => {
  const existing = await db.get('materials', id);
  return db.put('materials', { ...existing, ...material, id });
};

// Sofa Models
export const addSofaModel = async (model: any) => db.add('sofaModels', { ...model, id: Date.now() });
export const getSofaModels = async () => db.getAll('sofaModels');
export const deleteSofaModel = async (id: number) => db.delete('sofaModels', id);
export const updateSofaModel = async (id: number, model: any) => {
  const existing = await db.get('sofaModels', id);
  return db.put('sofaModels', { ...existing, ...model, id });
};

// Workers
export const addWorker = async (worker: any) => db.add('workers', { ...worker, id: Date.now() });
export const getWorkers = async () => db.getAll('workers');
export const deleteWorker = async (id: number) => db.delete('workers', id);
export const updateWorker = async (id: number, worker: any) => {
  const existing = await db.get('workers', id);
  return db.put('workers', { ...existing, ...worker, id });
};

// Stock Logs
export const addStockLog = async (log: any) => db.add('stockLogs', { ...log, id: Date.now() });
export const getStockLogs = async () => db.getAll('stockLogs');
export const deleteStockLog = async (id: number) => db.delete('stockLogs', id);

// Transactions
export const addTransaction = async (transaction: any) => db.add('transactions', { ...transaction, id: Date.now() });
export const getTransactions = async () => db.getAll('transactions');
export const deleteTransaction = async (id: number) => db.delete('transactions', id);