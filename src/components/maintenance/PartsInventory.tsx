import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Plus } from "lucide-react";
import { toast } from 'sonner';
import { useModal } from '@/contexts/ModalContext';
import { PartForm } from './PartForm';
import { EmptyState } from '@/components/ui/empty-state';

export function PartsInventory() {
  const { openModal } = useModal();

  const { data: parts, isLoading, error, refetch } = useQuery({
    queryKey: ['parts-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parts_inventory')
        .select('*')
        .order('part_name');

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load parts inventory', {
        id: 'parts-inventory-error',
        description: (error as Error)?.message,
        action: { label: 'Retry', onClick: () => refetch() },
      });
    }
  }, [error, refetch]);

  const handleAddPart = () => {
    openModal({
      title: "Add New Part",
      content: <PartForm onSuccess={() => refetch()} />,
      size: "lg"
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Parts Inventory</h2>
        <Button onClick={handleAddPart}>
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </Button>
      </div>

      {!parts || parts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No parts in inventory"
          description="Add parts to track stock levels, costs and supplier details."
          action={
            <Button onClick={handleAddPart}>
              <Plus className="h-4 w-4 mr-2" /> Add first part
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part Name</TableHead>
              <TableHead>Part Number</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Min. Quantity</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Supplier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part) => (
              <TableRow key={part.id}>
                <TableCell>{part.part_name}</TableCell>
                <TableCell>{part.part_number}</TableCell>
                <TableCell>{part.quantity}</TableCell>
                <TableCell>{part.min_quantity}</TableCell>
                <TableCell>${part.unit_cost}</TableCell>
                <TableCell>{part.supplier}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
