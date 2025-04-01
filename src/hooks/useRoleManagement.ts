
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRoleManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  // Check if user has specific role
  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    const userProfile = profile.get();
    if (!userProfile) return false;
    
    if (Array.isArray(role)) {
      return role.includes(userProfile.role);
    }
    
    return userProfile.role === role;
  }, [profile]);

  // Check if user is a company admin or above
  const isAdminOrAbove = useCallback((): boolean => {
    return hasRole(['super_admin', 'company_admin']);
  }, [hasRole]);

  // Update user role (for admins)
  const updateUserRole = useCallback(async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      if (!isAdminOrAbove()) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You don't have permission to update user roles"
        });
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Role Updated",
        description: "User role has been updated successfully"
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update user role"
      });
      return false;
    }
  }, [isAdminOrAbove, toast]);

  // Get all available roles 
  const getAllRoles = useCallback((): UserRole[] => {
    return ['super_admin', 'company_admin', 'supervisor', 'driver'];
  }, []);

  // Get assignable roles based on current user's role
  const getAssignableRoles = useCallback((): UserRole[] => {
    const userProfile = profile.get();
    if (!userProfile) return [];
    
    switch (userProfile.role) {
      case 'super_admin':
        return ['super_admin', 'company_admin', 'supervisor', 'driver'];
      case 'company_admin':
        return ['company_admin', 'supervisor', 'driver'];
      default:
        return [];
    }
  }, [profile]);

  return {
    hasRole,
    isAdminOrAbove,
    updateUserRole,
    getAllRoles,
    getAssignableRoles
  };
}
