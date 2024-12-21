export interface CurrencySetting {
  id: string;
  currency_code: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FuelPrice {
  id: string;
  fuel_type: string;
  price_per_liter: number;
  currency_id: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
}