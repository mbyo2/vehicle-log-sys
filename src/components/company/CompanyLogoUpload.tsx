import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";

interface CompanyLogoUploadProps {
  companyId: string;
  currentLogoUrl?: string | null;
}

export function CompanyLogoUpload({ companyId, currentLogoUrl }: CompanyLogoUploadProps) {
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl);
  const { toast } = useToast();

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}-logo.${fileExt}`;

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL (company logos are public assets)
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      // Update company record with new logo URL
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', companyId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast({
        title: "Logo updated",
        description: "Your company logo has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const removeLogo = async () => {
    try {
      setLoading(true);

      if (!logoUrl) return;

      const fileName = logoUrl.split('/').pop();
      if (!fileName) return;

      // Remove file from storage
      const { error: deleteError } = await supabase.storage
        .from('company-logos')
        .remove([fileName]);

      if (deleteError) throw deleteError;

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: null })
        .eq('id', companyId);

      if (updateError) throw updateError;

      setLogoUrl(null);
      toast({
        title: "Logo removed",
        description: "Your company logo has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Company logo"
            className="w-24 h-24 object-contain rounded-lg border bg-background"
          />
        ) : (
          <div className="w-24 h-24 flex items-center justify-center rounded-lg border bg-muted">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="relative"
          >
            {loading ? (
              <>
                <LoadingSpinner className="mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={uploadLogo}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={loading}
              onClick={removeLogo}
            >
              <X className="mr-2 h-4 w-4" />
              Remove Logo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}