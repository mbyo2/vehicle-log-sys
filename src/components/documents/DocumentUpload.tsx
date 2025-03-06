
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DocumentType } from '@/types/document';
import { useDocuments } from '@/hooks/useDocuments';
import { format } from 'date-fns';
import { CalendarIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const documentTypes: Array<{ value: DocumentType; label: string }> = [
  { value: 'driver_license', label: 'Driver License' },
  { value: 'vehicle_registration', label: 'Vehicle Registration' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'fitness_certificate', label: 'Fitness Certificate' },
  { value: 'road_tax', label: 'Road Tax' },
  { value: 'other', label: 'Other' },
];

const documentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.string().min(1, 'Document type is required'),
  expiry_date: z.date().optional(),
  vehicle_id: z.string().optional(),
  driver_id: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface DocumentUploadProps {
  companyId: string;
  vehicleId?: string;
  driverId?: string;
  onSuccess?: () => void;
}

export function DocumentUpload({ companyId, vehicleId, driverId, onSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const { uploadDocument, isUploading } = useDocuments();

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: '',
      type: '',
      vehicle_id: vehicleId,
      driver_id: driverId,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Use the file name as the default document name
      form.setValue('name', e.target.files[0].name);
    }
  };

  const onSubmit = async (values: DocumentFormValues) => {
    if (!file) return;

    const success = await uploadDocument(file, {
      name: values.name,
      type: values.type as DocumentType,
      expiry_date: values.expiry_date ? format(values.expiry_date, 'yyyy-MM-dd') : undefined,
      company_id: companyId,
      vehicle_id: vehicleId,
      driver_id: driverId,
    });

    if (success && onSuccess) {
      onSuccess();
      form.reset();
      setFile(null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">Document File</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            required
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter document name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiry_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiry Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isUploading || !file} className="w-full">
          {isUploading ? 'Uploading...' : 'Upload Document'}
          <Upload className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}
