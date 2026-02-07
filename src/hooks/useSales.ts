// src/hooks/useSales.ts
import { useState, useEffect } from 'react';
import { Customer, Sale, Payment, SaleItem, Agent, SaleCommission } from '@/types/sales';

const CUSTOMERS_KEY = 'sales_customers';
const SALES_KEY = 'sales_records';
const PAYMENTS_KEY = 'sales_payments';
const AGENTS_KEY = 'sales_agents';           // ← new key

export function useSales() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);   // ← new state

  useEffect(() => {
    const savedCustomers = localStorage.getItem(CUSTOMERS_KEY);
    const savedSales = localStorage.getItem(SALES_KEY);
    const savedPayments = localStorage.getItem(PAYMENTS_KEY);
    const savedAgents = localStorage.getItem(AGENTS_KEY);   // ← load agents

    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    if (savedAgents) setAgents(JSON.parse(savedAgents));
  }, []);

  const saveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(newCustomers));
  };

  const saveSales = (newSales: Sale[]) => {
    setSales(newSales);
    localStorage.setItem(SALES_KEY, JSON.stringify(newSales));
  };

  const savePayments = (newPayments: Payment[]) => {
    setPayments(newPayments);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(newPayments));
  };

  const saveAgents = (newAgents: Agent[]) => {          // ← new save function
    setAgents(newAgents);
    localStorage.setItem(AGENTS_KEY, JSON.stringify(newAgents));
  };

  // ────────────────────────────────────────────────
  // Customer Management (unchanged)
  // ────────────────────────────────────────────────
  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveCustomers([...customers, newCustomer]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    saveCustomers(customers.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCustomer = (id: string) => {
    saveCustomers(customers.filter(c => c.id !== id));
  };

  // ────────────────────────────────────────────────
  // NEW: Agent Management
  // ────────────────────────────────────────────────
  const addAgent = (agent: Omit<Agent, 'id' | 'createdAt'>) => {
    const newAgent: Agent = {
      ...agent,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveAgents([...agents, newAgent]);
  };

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    saveAgents(agents.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAgent = (id: string) => {
    saveAgents(agents.filter(a => a.id !== id));
  };

  // ────────────────────────────────────────────────
  // Sales Management – updated to handle commissions
  // ────────────────────────────────────────────────
  const addSale = (
    saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>,
    onInventoryUpdate?: (materialUpdates: Array<{ id: string; quantityChange: number }>) => void
  ) => {
    const newSale: Sale = {
      ...saleData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate material reductions (unchanged)
    if (onInventoryUpdate) {
      const materialUpdates = newSale.items
        .filter(item => item.type === 'material' && item.materialId)
        .map(item => ({
          id: item.materialId!,
          quantityChange: -item.quantity,
        }));

      if (materialUpdates.length > 0) {
        onInventoryUpdate(materialUpdates);
      }
    }

    // Optional: recalculate commission amounts if needed (usually done in form)
    if (newSale.commissions?.length) {
      newSale.commissionAmount = newSale.commissions.reduce(
        (sum, c) => sum + c.amount,
        0
      );
      newSale.netTotal = newSale.total - newSale.commissionAmount;
    }

    saveSales([...sales, newSale]);
    return newSale;
  };

  const updateSale = (id: string, updates: Partial<Sale>) => {
    saveSales(
      sales.map(s =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const deleteSale = (id: string) => {
    saveSales(sales.filter(s => s.id !== id));
    savePayments(payments.filter(p => p.saleId !== id));
  };

  // Payment Management (unchanged)
  const addPayment = (payment: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const sale = sales.find(s => s.id === payment.saleId);
    if (sale) {
      const newAmountPaid = sale.amountPaid + payment.amount;
      const newBalance = sale.total - newAmountPaid;
      const newPaymentStatus: Sale['paymentStatus'] =
        newBalance <= 0 ? 'paid' : newBalance < sale.total ? 'partial' : 'unpaid';

      updateSale(sale.id, {
        amountPaid: newAmountPaid,
        balance: newBalance,
        paymentStatus: newPaymentStatus,
      });
    }

    savePayments([...payments, newPayment]);
  };

  const deletePayment = (id: string) => {
    const payment = payments.find(p => p.id === id);
    if (payment) {
      const sale = sales.find(s => s.id === payment.saleId);
      if (sale) {
        const newAmountPaid = sale.amountPaid - payment.amount;
        const newBalance = sale.total - newAmountPaid;
        const newPaymentStatus: Sale['paymentStatus'] =
          newBalance <= 0 ? 'paid' : newBalance < sale.total ? 'partial' : 'unpaid';

        updateSale(sale.id, {
          amountPaid: newAmountPaid,
          balance: newBalance,
          paymentStatus: newPaymentStatus,
        });
      }
    }
    savePayments(payments.filter(p => p.id !== id));
  };

  return {
    customers,
    sales,
    payments,
    agents,                // ← now returned
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSale,
    updateSale,
    deleteSale,
    addPayment,
    deletePayment,
    addAgent,              // ← new
    updateAgent,           // ← new
    deleteAgent,           // ← new
  };
}