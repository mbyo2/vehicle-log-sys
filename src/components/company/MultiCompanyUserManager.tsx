import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Trash2, UserPlus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { UserRole } from '@/types/auth';

interface UserCompany {
  company_id: string;
  company_name: string;
  role: UserRole;
}

interface MultiCompanyUserManagerProps {
  userId: string;
  userName: string;
  currentRole?: UserRole;
}

export function MultiCompanyUserManager({ userId, userName, currentRole }: MultiCompanyUserManagerProps) {
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('driver');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const roles: UserRole[] = ['company_admin', 'supervisor', 'driver'];

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load user's current companies
      const { data: companies, error: companiesError } = await supabase.rpc('get_user_companies', {
        p_user_id: userId
      });

      if (companiesError) throw companiesError;

      setUserCompanies(companies || []);

      // Load all available companies (excluding ones user is already in)
      const { data: allCompanies, error: allCompaniesError } = await supabase
        .from('companies')
        .select('id, name, subscription_type')
        .eq('is_active', true)
        .order('name');

      if (allCompaniesError) throw allCompaniesError;

      // Filter out companies user is already a member of
      const userCompanyIds = (companies || []).map((c: UserCompany) => c.company_id);
      const available = (allCompanies || []).filter((c) => !userCompanyIds.includes(c.id));
      setAvailableCompanies(available);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load company data'
      });
    } finally {
      setLoading(false);
    }
  };

  const addUserToCompany = async () => {
    if (!selectedCompany || !selectedRole) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select both a company and role'
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          company_id: selectedCompany,
          role: selectedRole
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User added to company successfully'
      });

      setSelectedCompany('');
      setSelectedRole('driver');
      loadData();

    } catch (error: any) {
      console.error('Error adding user to company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add user to company'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeUserFromCompany = async (companyId: string) => {
    if (userCompanies.length === 1) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot remove user from their only company'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User removed from company'
      });

      loadData();

    } catch (error: any) {
      console.error('Error removing user from company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove user from company'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-Company Management</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Multi-Company Management
        </CardTitle>
        <CardDescription>
          Manage {userName}'s company memberships and roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Companies */}
        <div>
          <h3 className="text-sm font-medium mb-3">Current Companies ({userCompanies.length})</h3>
          <div className="space-y-2">
            {userCompanies.map((company) => (
              <div
                key={company.company_id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{company.company_name}</p>
                    <Badge variant="secondary" className="text-xs capitalize mt-1">
                      {company.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUserFromCompany(company.company_id)}
                  disabled={userCompanies.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            {userCompanies.length === 0 && (
              <p className="text-sm text-muted-foreground">No companies yet</p>
            )}
          </div>
        </div>

        {/* Add to New Company */}
        {availableCompanies.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Add to Another Company</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Company
                  </label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Role
                  </label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role} className="capitalize">
                          {role.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={addUserToCompany}
                disabled={!selectedCompany || !selectedRole || submitting}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {submitting ? 'Adding...' : 'Add to Company'}
              </Button>
            </div>
          </div>
        )}

        {availableCompanies.length === 0 && userCompanies.length > 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            User is already a member of all active companies
          </p>
        )}
      </CardContent>
    </Card>
  );
}
