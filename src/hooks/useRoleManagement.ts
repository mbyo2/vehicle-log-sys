import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  isAdminRole, 
  isSuperAdmin, 
  canManageUser, 
  getAssignableRoles as getAssignableRolesFromLib,
  getAllRoles as getAllRolesFromLib,
  getRoleDisplayName 
} from '@/lib/permissions';

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

  // Check if user is a company admin or above - full access
  const isAdminOrAbove = useCallback((): boolean => {
    const userProfile = profile.get();
    return isAdminRole(userProfile?.role);
  }, [profile]);

  // Check if user is super admin - ultimate access
  const isSuperAdminUser = useCallback((): boolean => {
    const userProfile = profile.get();
    return isSuperAdmin(userProfile?.role);
  }, [profile]);

  // Update user role (for admins)
  const updateUserRole = useCallback(async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const userProfile = profile.get();
      
      if (!isAdminRole(userProfile?.role)) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You don't have permission to update user roles"
        });
        return false;
      }

      // Get target user's current role to check if we can manage them
      const { data: targetRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const targetRole = (targetRoleData?.role || 'driver') as UserRole;
      
      if (!canManageUser(userProfile?.role, targetRole)) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You cannot modify this user's role"
        });
        return false;
      }

      // Get user's company_id from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

      // Delete existing role and insert new one
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole,
          company_id: profileData?.company_id
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${getRoleDisplayName(newRole)}`
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
  }, [profile, toast]);

  // Get all available roles 
  const getAllRoles = useCallback((): UserRole[] => {
    return getAllRolesFromLib();
  }, []);

  // Get assignable roles based on current user's role
  const getAssignableRoles = useCallback((): UserRole[] => {
    const userProfile = profile.get();
    return getAssignableRolesFromLib(userProfile?.role);
  }, [profile]);

  return {
    hasRole,
    isAdminOrAbove,
    isSuperAdminUser,
    updateUserRole,
    getAllRoles,
    getAssignableRoles
  };
}
