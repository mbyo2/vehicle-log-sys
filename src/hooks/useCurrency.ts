import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CurrencySetting, FuelPrice } from "@/types/currency";
import { toast } from "@/hooks/use-toast";

export function useCurrency() {
  const queryClient = useQueryClient();

  const { data: currencies, isLoading: currenciesLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("currency_settings")
        .select("*")
        .order("is_default", { ascending: false });

      if (error) throw error;
      return data as CurrencySetting[];
    },
  });

  const { data: fuelPrices, isLoading: fuelPricesLoading } = useQuery({
    queryKey: ["fuel-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_prices")
        .select(`
          *,
          currency_settings (
            currency_code,
            symbol,
            exchange_rate
          )
        `)
        .order("effective_date", { ascending: false });

      if (error) throw error;
      return data as (FuelPrice & {
        currency_settings: Pick<CurrencySetting, "currency_code" | "symbol" | "exchange_rate">;
      })[];
    },
  });

  const createCurrency = useMutation({
    mutationFn: async (newCurrency: Omit<CurrencySetting, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("currency_settings")
        .insert([newCurrency])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      toast({
        title: "Currency added",
        description: "The currency has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add currency: " + error.message,
        variant: "destructive",
      });
    },
  });

  const createFuelPrice = useMutation({
    mutationFn: async (newPrice: Omit<FuelPrice, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("fuel_prices")
        .insert([newPrice])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-prices"] });
      toast({
        title: "Fuel price added",
        description: "The fuel price has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add fuel price: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    currencies,
    fuelPrices,
    isLoading: currenciesLoading || fuelPricesLoading,
    createCurrency,
    createFuelPrice,
  };
}