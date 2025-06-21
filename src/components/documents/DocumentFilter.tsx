
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DocumentFilterProps {
  onFilterChange: (filters: DocumentFilters) => void;
  categories: Array<{ id: string; name: string; }>;
}

export interface DocumentFilters {
  search: string;
  type: string;
  status: string;
  category: string;
  expiringSoon: boolean;
  expired: boolean;
}

export function DocumentFilter({ onFilterChange, categories }: DocumentFilterProps) {
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    type: '',
    status: '',
    category: '',
    expiringSoon: false,
    expired: false,
  });

  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof DocumentFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: DocumentFilters = {
      search: '',
      type: '',
      status: '',
      category: '',
      expiringSoon: false,
      expired: false,
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = Object.values(filters).filter(v => 
    typeof v === 'boolean' ? v : v !== ''
  ).length;

  const documentTypes = [
    'driver_license',
    'vehicle_registration', 
    'insurance',
    'fitness_certificate',
    'road_tax',
    'other'
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder="Search documents..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter Documents</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Document Type</label>
                <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {documentTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Filters</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.expiringSoon ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('expiringSoon', !filters.expiringSoon)}
                  >
                    Expiring Soon
                  </Button>
                  <Button
                    variant={filters.expired ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('expired', !filters.expired)}
                  >
                    Expired
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
