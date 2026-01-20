// src/hooks/useSales.ts
import { useState, useEffect } from 'react';
import { Customer, Sale, Payment, SaleItem } from '@/types/sales';

const CUSTOMERS_KEY = 'sales_customers';
const SALES_KEY = 'sales_records';
const PAYMENTS_KEY = 'sales_payments';

export function useSales() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const savedCustomers = localStorage.getItem(CUSTOMERS_KEY);
    const savedSales = localStorage.getItem(SALES_KEY);
    const savedPayments = localStorage.getItem(PAYMENTS_KEY);

    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedPayments) setPayments(JSON.parse(savedPayments));
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

  // Customer Management
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

  // Sales Management
  const addSale = (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>, onInventoryUpdate?: (materialUpdates: Array<{id: string, quantityChange: number}>) => void) => {
    const newSale: Sale = {
      ...sale,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Calculate material inventory reductions
    if (onInventoryUpdate) {
      const materialUpdates = newSale.items
        .filter(item => item.type === 'material' && item.materialId)
        .map(item => ({
          id: item.materialId!,
          quantityChange: -item.quantity, // negative because we're selling/reducing
        }));
      
      if (materialUpdates.length > 0) {
        onInventoryUpdate(materialUpdates);
      }
    }
    
    saveSales([...sales, newSale]);
    return newSale;
  };

  const updateSale = (id: string, updates: Partial<Sale>) => {
    saveSales(sales.map(s => s.id === id 
      ? { ...s, ...updates, updatedAt: new Date().toISOString() } 
      : s
    ));
  };

  const deleteSale = (id: string) => {
    saveSales(sales.filter(s => s.id !== id));
    // Also delete related payments
    savePayments(payments.filter(p => p.saleId !== id));
  };

  // Payment Management
  const addPayment = (payment: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    // Update sale payment status and balance
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
      // Rollback sale payment
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
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSale,
    updateSale,
    deleteSale,
    addPayment,
    deletePayment,
  };
}