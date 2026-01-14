import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItems, addItem, deleteItem, updateItem } from '@/lib/db';

export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: getItems,
  });
};

export const useAddItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, item }: { id: number; item: any }) =>
      updateItem(id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};