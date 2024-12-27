import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface PartFormProps {
  onSuccess: () => void;
}

export function PartForm({ onSuccess }: PartFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('parts_inventory')
        .insert([{
          part_name: data.partName,
          part_number: data.partNumber,
          quantity: parseInt(data.quantity),
          min_quantity: parseInt(data.minQuantity),
          unit_cost: parseFloat(data.unitCost),
          supplier: data.supplier,
          description: data.description
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Part added successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error adding part:', error);
      toast({
        title: "Error",
        description: "Failed to add part",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="partName">Part Name</label>
          <Input
            id="partName"
            {...register('partName', { required: true })}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="partNumber">Part Number</label>
          <Input
            id="partNumber"
            {...register('partNumber')}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="quantity">Quantity</label>
          <Input
            id="quantity"
            type="number"
            {...register('quantity', { required: true, min: 0 })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="minQuantity">Minimum Quantity</label>
          <Input
            id="minQuantity"
            type="number"
            {...register('minQuantity', { required: true, min: 0 })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="unitCost">Unit Cost</label>
          <Input
            id="unitCost"
            type="number"
            step="0.01"
            {...register('unitCost', { required: true, min: 0 })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="supplier">Supplier</label>
          <Input
            id="supplier"
            {...register('supplier')}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Part'}
      </Button>
    </form>
  );
}