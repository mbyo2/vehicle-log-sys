import { useState } from 'react';
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
import { Plus } from "lucide-react";
import { useModal } from '@/contexts/ModalContext';
import { PartForm } from './PartForm';

export function PartsInventory() {
  const { openModal } = useModal();
  
  const { data: parts, isLoading, refetch } = useQuery({
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

  const handleAddPart = () => {
    openModal({
      title: "Add New Part",
      content: <PartForm onSuccess={() => refetch()} />,
      size: "lg"
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
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
          {parts?.map((part) => (
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
    </div>
  );
}