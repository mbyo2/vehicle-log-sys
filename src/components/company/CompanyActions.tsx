import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CompanyActionsProps {
  onAddCompany: () => void;
}

export function CompanyActions({ onAddCompany }: CompanyActionsProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold">Companies</h1>
      <Button onClick={onAddCompany}>
        <Plus className="h-4 w-4 mr-2" />
        Add Company
      </Button>
    </div>
  );
}