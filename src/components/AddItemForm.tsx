import { useState } from 'react';
import { useAddItem } from '@/hooks/useItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const AddItemForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { mutate: addItem, isPending } = useAddItem();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addItem({
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setName('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Item Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter item name"
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description (optional)"
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Item'}
      </Button>
    </form>
  );
};