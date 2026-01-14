import { useItems, useDeleteItem, useUpdateItem } from '@/hooks/useItems';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const ItemList = () => {
  const { data: items = [], isLoading } = useItems();
  const { mutate: deleteItem } = useDeleteItem();
  const { mutate: updateItem } = useUpdateItem();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  if (isLoading) return <div className="p-4">Loading items...</div>;

  return (
    <div className="space-y-2 p-4">
      {items.length === 0 ? (
        <div className="text-center text-gray-500 p-4">No items yet. Add one to get started!</div>
      ) : (
        items.map((item: any) => (
          <div key={item.id} className="border rounded-lg p-4 flex justify-between items-start">
            <div className="flex-1">
              {editingId === item.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
              ) : (
                <>
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
            <div className="space-x-2">
              {editingId === item.id ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      updateItem({ id: item.id, item: { name: editName, updatedAt: new Date() } });
                      setEditingId(null);
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditName(item.name);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};