
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CompanyActionsProps {
  onAddCompany: () => void;
}

export function CompanyActions({ onAddCompany }: CompanyActionsProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
        <p className="text-muted-foreground">
          Manage companies and their settings
        </p>
      </div>
      <Button onClick={onAddCompany}>
        <Plus className="mr-2 h-4 w-4" /> Add Company
      </Button>
    </div>
  );
}
