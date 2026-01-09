import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { RawMaterial } from '@/types/inventory';
import { MaterialForm } from './MaterialForm';

interface MaterialsTableProps {
  materials: RawMaterial[];
  onUpdate: (id: string, updates: Partial<RawMaterial>) => void;
  onDelete: (id: string) => void;
}

export function MaterialsTable({ materials, onUpdate, onDelete }: MaterialsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Cost/Unit</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No materials added yet. Add your first material to get started.
              </TableCell>
            </TableRow>
          ) : (
            materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell className="font-medium">{material.name}</TableCell>
                <TableCell>{material.category}</TableCell>
                <TableCell className="text-right">{material.quantity}</TableCell>
                <TableCell>{material.unit}</TableCell>
                <TableCell className="text-right">${material.costPerUnit.toFixed(2)}</TableCell>
                <TableCell>{material.supplier || '-'}</TableCell>
                <TableCell>
                  {material.quantity <= material.minStock ? (
                    <Badge variant="destructive">Low Stock</Badge>
                  ) : (
                    <Badge variant="secondary">In Stock</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <MaterialForm
                      initialData={material}
                      onSubmit={(data) => onUpdate(material.id, data)}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
