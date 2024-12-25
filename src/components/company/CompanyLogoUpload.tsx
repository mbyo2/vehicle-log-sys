import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/types/auth";

interface CompanyLogoUploadProps {
  company: Company;
  onSuccess: () => void;
}

export function CompanyLogoUpload({ company, onSuccess }: CompanyLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${company.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: publicUrl.publicUrl })
        .eq("id", company.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Company logo updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error uploading logo",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label>Company Logo</Label>
        <p className="text-sm text-muted-foreground">
          Upload your company logo
        </p>
      </div>
      <div className="flex items-center space-x-2">
        {company.logo_url && (
          <img
            src={company.logo_url}
            alt="Company logo"
            className="h-10 w-10 rounded object-cover"
          />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById("logo-upload")?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>
    </div>
  );
}