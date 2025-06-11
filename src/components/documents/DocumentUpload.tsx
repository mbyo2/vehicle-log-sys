
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { documentSchema, fileValidation } from '@/lib/validation';
import { z } from 'zod';

const documentTypes: Array<{ value: DocumentType; label: string }> = [
  { value: 'driver_license', label: 'Driver License' },
  { value: 'vehicle_registration', label: 'Vehicle Registration' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'fitness_certificate', label: 'Fitness Certificate' },
  { value: 'road_tax', label: 'Road Tax' },
  { value: 'other', label: 'Other' },
];

const uploadSchema = documentSchema.extend({
  file: z.custom<File>((val) => val instanceof File, 'Please select a file'),
});

type DocumentFormValues = z.infer<typeof uploadSchema>;

interface DocumentUploadProps {
  companyId: string;
  vehicleId?: string;
  driverId?: string;
  onSuccess?: () => void;
}

export function DocumentUpload({ companyId, vehicleId, driverId, onSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const { uploadDocument, isUploading } = useDocuments();

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: '',
      type: 'other' as DocumentType,
      vehicle_id: vehicleId,
      driver_id: driverId,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file
      const validation = fileValidation.validateFile(selectedFile);
      if (!validation.isValid) {
        setFileError(validation.errors.join(', '));
        setFile(null);
        return;
      }

      setFileError('');
      setFile(selectedFile);
      form.setValue('file', selectedFile);
      
      // Use the file name as the default document name
      if (!form.getValues('name')) {
        form.setValue('name', selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const onSubmit = async (values: DocumentFormValues) => {
    if (!file) return;

    try {
      await uploadDocument.mutateAsync({
        file,
        documentData: {
          name: values.name,
          type: values.type,
          expiry_date: values.expiry_date ? format(values.expiry_date, 'yyyy-MM-dd') : undefined,
          company_id: companyId,
          vehicle_id: vehicleId,
          driver_id: driverId,
        },
      });

      if (onSuccess) {
        onSuccess();
        form.reset();
        setFile(null);
        setFileError('');
      }
    } catch (error) {
      // Error is handled by the mutation
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
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            required
            className={fileError ? 'border-red-500' : ''}
          />
          {fileError && (
            <p className="text-sm text-red-600">{fileError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF. Max size: 10MB
          </p>
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
                value={field.value}
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
              <FormLabel>Expiry Date (Optional)</FormLabel>
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
