// src/components/payroll/EmployeesPanel.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash, UserCheck, UserX } from 'lucide-react';
import { Employee } from '@/types/inventory';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getCurrentDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface EmployeesPanelProps {
  employees: Employee[];
  onAdd: (emp: Omit<Employee, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Employee>) => void;
  onDelete: (id: string) => void;
}

export function EmployeesPanel({ employees, onAdd, onUpdate, onDelete }: EmployeesPanelProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    employmentType: 'daily' as 'daily' | 'monthly' | 'project',
    dailyRate: 0,
    monthlyRate: 0,
    sssNumber: '',
    philhealthNumber: '',
    pagibigNumber: '',
    tinNumber: '',
    dateHired: getCurrentDateString(),
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      employmentType: 'daily',
      dailyRate: 0,
      monthlyRate: 0,
      sssNumber: '',
      philhealthNumber: '',
      pagibigNumber: '',
      tinNumber: '',
      dateHired: getCurrentDateString(),
      isActive: true,
    });
    setEditingId(null);
  };

  const handleEdit = (emp: PayrollEmployee) => {
    setFormData({
      name: emp.name,
      position: emp.position,
      employmentType: emp.employmentType,
      dailyRate: emp.dailyRate || 0,
      monthlyRate: emp.monthlyRate || 0,
      sssNumber: emp.sssNumber || '',
      philhealthNumber: emp.philhealthNumber || '',
      pagibigNumber: emp.pagibigNumber || '',
      tinNumber: emp.tinNumber || '',
      dateHired: emp.dateHired,
      isActive: emp.isActive,
    });
    setEditingId(emp.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    
    setOpen(false);
    resetForm();
  };

  const formatCurrency = (value: number) =>
    `₱ ${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payroll Employees</CardTitle>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position *</Label>
                    <Input
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type *</Label>
                    <Select 
                      value={formData.employmentType} 
                      onValueChange={v => setFormData({ ...formData, employmentType: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="project">Project-Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Hired *</Label>
                    <Input
                      type="date"
                      value={formData.dateHired}
                      onChange={e => setFormData({ ...formData, dateHired: e.target.value })}
                      required
                    />
                  </div>
                  
                  {formData.employmentType === 'daily' && (
                    <div className="space-y-2">
                      <Label>Daily Rate (₱)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.dailyRate}
                        onChange={e => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                      />
                    </div>
                  )}
                  
                  {formData.employmentType === 'monthly' && (
                    <div className="space-y-2">
                      <Label>Monthly Rate (₱)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthlyRate}
                        onChange={e => setFormData({ ...formData, monthlyRate: Number(e.target.value) })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>SSS Number</Label>
                    <Input
                      value={formData.sssNumber}
                      onChange={e => setFormData({ ...formData, sssNumber: e.target.value })}
                      placeholder="00-0000000-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PhilHealth Number</Label>
                    <Input
                      value={formData.philhealthNumber}
                      onChange={e => setFormData({ ...formData, philhealthNumber: e.target.value })}
                      placeholder="00-000000000-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pag-IBIG Number</Label>
                    <Input
                      value={formData.pagibigNumber}
                      onChange={e => setFormData({ ...formData, pagibigNumber: e.target.value })}
                      placeholder="0000-0000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TIN</Label>
                    <Input
                      value={formData.tinNumber}
                      onChange={e => setFormData({ ...formData, tinNumber: e.target.value })}
                      placeholder="000-000-000-000"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">Active Employee</Label>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? 'Update Employee' : 'Add Employee'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Position</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Rate</th>
                <th className="p-3 text-left font-medium">Date Hired</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No employees added yet
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{emp.name}</td>
                    <td className="p-3">{emp.position}</td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {emp.employmentType}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {emp.employmentType === 'daily' && emp.dailyRate 
                        ? formatCurrency(emp.dailyRate) + '/day'
                        : emp.employmentType === 'monthly' && emp.monthlyRate
                        ? formatCurrency(emp.monthlyRate) + '/mo'
                        : '—'}
                    </td>
                    <td className="p-3">{emp.dateHired ? formatDate(emp.dateHired) : '—'}</td>
                    <td className="p-3">
                      {emp.isActive !== false ? (
                        <Badge className="bg-green-100 text-green-800">
                          <UserCheck className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <UserX className="h-3 w-3 mr-1" /> Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(emp.id)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}