// src/components/sales/CustomersPanel.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash, UserPlus } from 'lucide-react';
import { Customer } from '@/types/sales';

interface CustomersPanelProps {
  customers: Customer[];
  onAdd: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Customer>) => void;
  onDelete: (id: string) => void;
}

export function CustomersPanel({ customers, onAdd, onUpdate, onDelete }: CustomersPanelProps) {
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    email: '',
    address: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const resetForm = () => {
    setFormData({ name: '', contactNumber: '', email: '', address: '' });
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Customer name is required');
      return;
    }

    if (editingCustomer) {
      onUpdate(editingCustomer.id, formData);
    } else {
      onAdd(formData);
    }

    setOpen(false);
    resetForm();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contactNumber: customer.contactNumber || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      onDelete(id);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contactNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customers</CardTitle>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    value={formData.contactNumber}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="e.g., 09171234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
                  </Button>
                  {editingCustomer && (
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No customers found' : 'No customers added yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.contactNumber || '—'}</TableCell>
                    <TableCell>{customer.email || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}