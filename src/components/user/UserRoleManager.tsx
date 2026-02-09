import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Trash2 } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
  created_at: string;
  role: UserRole;
}

export function UserRoleManager() {
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const currentProfile = profile.get();
  const isSuperAdmin = currentProfile?.role === "super_admin";

  const { data: users, isLoading } = useQuery({
    queryKey: ["company-users-with-roles", currentProfile?.company_id, isSuperAdmin],
    queryFn: async () => {
      if (!currentProfile) return [];

      // Fetch profiles
      let profileQuery = supabase.from("profiles").select("*");
      
      if (!isSuperAdmin && currentProfile.company_id) {
        profileQuery = profileQuery.eq("company_id", currentProfile.company_id);
      }

      const { data: profiles, error: profileError } = await profileQuery.order("created_at", { ascending: false });
      if (profileError) throw profileError;
      if (!profiles) return [];

      // Fetch roles for all these users
      const userIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      
      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const roleMap = new Map<string, UserRole>();
      roles?.forEach(r => {
        // Keep highest priority role if multiple
        const existing = roleMap.get(r.user_id);
        if (!existing) roleMap.set(r.user_id, r.role as UserRole);
      });

      return profiles.map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        company_id: p.company_id,
        created_at: p.created_at,
        role: roleMap.get(p.id) || ("driver" as UserRole),
      })) as UserWithRole[];
    },
    enabled: !!currentProfile,
  });

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUser(userId);
      const user = users?.find(u => u.id === userId);

      // Delete existing role(s) for this user
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Insert new role
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: newRole,
        company_id: user?.company_id || currentProfile?.company_id,
      });

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole.replace("_", " ")}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["company-users-with-roles"] });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update user role.",
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const removeUser = async (userId: string) => {
    try {
      setUpdatingUser(userId);
      
      // Remove role assignment (effectively removes from company)
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "User Removed",
        description: "User has been removed from the company.",
      });

      queryClient.invalidateQueries({ queryKey: ["company-users-with-roles"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Remove Failed",
        description: error.message || "Failed to remove user.",
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "destructive" as const;
      case "company_admin":
        return "default" as const;
      case "supervisor":
        return "secondary" as const;
      case "driver":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  const getAvailableRoles = (): UserRole[] => {
    if (!currentProfile) return [];
    if (currentProfile.role === "super_admin") {
      return ["super_admin", "company_admin", "supervisor", "driver"];
    }
    if (currentProfile.role === "company_admin") {
      return ["company_admin", "supervisor", "driver"];
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  const canManageRoles = currentProfile?.role === "super_admin" || currentProfile?.role === "company_admin";
  if (!canManageRoles) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">You don't have permission to manage user roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || "N/A"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.id !== currentProfile?.id ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(newRole: string) =>
                            updateUserRole(user.id, newRole as UserRole)
                          }
                          disabled={updatingUser === user.id}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableRoles().map((role) => (
                              <SelectItem key={role} value={role}>
                                {role.replace("_", " ").toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeUser(user.id)}
                          disabled={updatingUser === user.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">(You)</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
