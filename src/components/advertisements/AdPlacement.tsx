import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

export function AdPlacement() {
  const { toast } = useToast();
  const [selectedAd, setSelectedAd] = useState<string | null>(null);

  const { data: ads, isLoading } = useQuery({
    queryKey: ['homepage-ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('placement_location', 'homepage')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString());

      if (error) throw error;
      return data;
    }
  });

  const handleAdClick = async (adId: string) => {
    try {
      // Update click count
      await supabase.rpc('increment_ad_clicks', { ad_id: adId });
      setSelectedAd(adId);
      
      // Find the ad URL or content
      const ad = ads?.find(a => a.id === adId);
      if (ad?.content) {
        window.open(ad.content, '_blank');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not process ad click",
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {ads?.map((ad) => (
        <Card 
          key={ad.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleAdClick(ad.id)}
        >
          <CardHeader>
            <CardTitle className="text-lg">{ad.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{ad.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}