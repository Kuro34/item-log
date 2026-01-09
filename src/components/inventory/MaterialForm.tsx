import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { RawMaterial } from '@/types/inventory';

interface MaterialFormProps {
  onSubmit: (material: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: RawMaterial;
  trigger?: React.ReactNode;
}

export function MaterialForm({ onSubmit, initialData, trigger }: MaterialFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    unit: initialData?.unit || '',
    quantity: initialData?.quantity || 0,
    minStock: initialData?.minStock || 0,
    costPerUnit: initialData?.costPerUnit || 0,
    supplier: initialData?.supplier || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setOpen(false);
    if (!initialData) {
      setFormData({ name: '', category: '', unit: '', quantity: 0, minStock: 0, costPerUnit: 0, supplier: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Material' : 'Add New Material'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Material Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit (kg, pcs, etc.)</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Min Stock Alert</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost Per Unit</Label>
              <Input
                id="costPerUnit"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            {initialData ? 'Update Material' : 'Add Material'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
