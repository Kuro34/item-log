import React from 'react';
import { RawMaterial } from '@/types/inventory';

type MaterialsTableProps = {
  materials?: RawMaterial[];
  onUpdate: (id: string, updates: Partial<RawMaterial>) => void;
  onDelete: (id: string) => void;
};

export default function MaterialsTable({ materials = [], onUpdate, onDelete }: MaterialsTableProps) {
  if (!materials || materials.length === 0) return <div>No materials found.</div>;

  return (
    <div className="w-full overflow-auto">
      <table className="w-full table-auto border border-gray-200">
        <thead className="bg-gray-100 border-b border-gray-300">
          <tr>
            <th className="text-left px-3 py-2 border-r border-gray-300">Name</th>
            <th className="text-left px-3 py-2 border-r border-gray-300">Category</th>
            <th className="text-left px-3 py-2 border-r border-gray-300">Supplier</th>
            <th className="text-right px-3 py-2 border-r border-gray-300">Qty</th>
            <th className="text-right px-3 py-2 border-r border-gray-300">Min Stock</th>
            <th className="text-right px-3 py-2 border-r border-gray-300">Cost</th>
            <th className="text-right px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-3 py-2 border-r border-gray-200">{m.name}</td>
              <td className="px-3 py-2 border-r border-gray-200">{m.category}</td>
              <td className="px-3 py-2 text-right border-r border-gray-200">{m.supplier}</td>
              <td className="px-3 py-2 text-right border-r border-gray-200">{m.quantity}</td>
              <td className="px-3 py-2 text-right border-r border-gray-200">{m.minStock ?? '-'}</td>
              <td className="px-3 py-2 text-right border-r border-gray-200">
                {m.costPerUnit != null ? `₱ ${m.costPerUnit.toFixed(2)}` : '-'}
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onUpdate(m.id, {})}
                  className="mr-2 text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(m.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
