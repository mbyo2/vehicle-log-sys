import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/hooks/useCurrency";

export function CurrencySettings() {
  const { currencies, fuelPrices, isLoading } = useCurrency();

  if (isLoading) {
    return <div>Loading currency settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currencies?.map((currency) => (
              <div
                key={currency.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {currency.currency_code} ({currency.symbol})
                  </p>
                  <p className="text-sm text-gray-600">
                    Exchange Rate: {currency.exchange_rate}
                  </p>
                </div>
                {currency.is_default && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Fuel Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fuelPrices?.map((price) => (
              <div
                key={price.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{price.fuel_type}</p>
                  <p className="text-sm text-gray-600">
                    {price.currency_settings.symbol}
                    {price.price_per_liter} per liter
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(price.effective_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}