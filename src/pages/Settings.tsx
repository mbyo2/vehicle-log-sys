import React from "react";
import { CurrencySettings } from "@/components/currency/CurrencySettings";

export default function Settings() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <CurrencySettings />
    </div>
  );
}