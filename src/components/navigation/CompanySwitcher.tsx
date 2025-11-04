import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useCompanySwitcher } from "@/hooks/useCompanySwitcher";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface CompanySwitcherProps {
  userId: string | undefined;
  className?: string;
}

export function CompanySwitcher({ userId, className }: CompanySwitcherProps) {
  const [open, setOpen] = useState(false);
  const { companies, currentCompany, loading, switchCompany } = useCompanySwitcher(userId);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <LoadingSpinner size={16} />
      </div>
    );
  }

  // Don't show switcher if user has only one company
  if (companies.length <= 1) {
    return null;
  }

  const handleSelect = (companyId: string) => {
    if (companyId !== currentCompany?.company_id) {
      switchCompany(companyId);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a company"
          className={cn("justify-between", className)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {currentCompany?.company_logo ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={currentCompany.company_logo} alt={currentCompany.company_name} />
                <AvatarFallback>
                  <Building2 className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Building2 className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="truncate">{currentCompany?.company_name || 'Select Company'}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search companies..." />
          <CommandEmpty>No company found.</CommandEmpty>
          <CommandList>
            <CommandGroup heading="Your Companies">
              {companies.map((company) => (
                <CommandItem
                  key={company.company_id}
                  onSelect={() => handleSelect(company.company_id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {company.company_logo ? (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={company.company_logo} alt={company.company_name} />
                        <AvatarFallback>
                          <Building2 className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate font-medium">{company.company_name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {company.role.replace('_', ' ')}
                        </Badge>
                        {company.subscription_type === 'trial' && (
                          <Badge variant="outline" className="text-xs">
                            Trial
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4 flex-shrink-0",
                      currentCompany?.company_id === company.company_id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
