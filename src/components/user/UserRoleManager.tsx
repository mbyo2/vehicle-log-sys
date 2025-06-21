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

interface UserWithProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_id: string;
  created_at: string;
}

export function UserRoleManager() {
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["company-users", profile.get()?.company_id],
    queryFn: async () => {
      const currentProfile = profile.get();
      if (!currentProfile?.company_id) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", currentProfile.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserWithProfile[];
    },
    enabled: !!profile.get()?.company_id,
  });

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUser(userId);

      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });

      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
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

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "company_admin":
        return "default";
      case "supervisor":
        return "secondary";
      case "driver":
        return "outline";
      default:
        return "outline";
    }
  };

  const getAvailableRoles = (currentUserRole: UserRole): UserRole[] => {
    const currentProfile = profile.get();
    if (!currentProfile) return [];

    // Super admins can assign any role
    if (currentProfile.role === "super_admin") {
      return ["super_admin", "company_admin", "supervisor", "driver"];
    }

    // Company admins can assign roles below them
    if (currentProfile.role === "company_admin") {
      return ["company_admin", "supervisor", "driver"];
    }

    // Others cannot assign roles
    return [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  const currentProfile = profile.get();
  const canManageRoles = currentProfile?.role === "super_admin" || currentProfile?.role === "company_admin";

  if (!canManageRoles) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          You don't have permission to manage user roles.
        </p>
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
            {users?.map((user) => (
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
                  {user.id !== currentProfile?.id && (
                    <Select
                      value={user.role}
                      onValueChange={(newRole: UserRole) =>
                        updateUserRole(user.id, newRole)
                      }
                      disabled={updatingUser === user.id}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRoles(user.role).map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.replace("_", " ").toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {user.id === currentProfile?.id && (
                    <span className="text-sm text-muted-foreground">
                      (You)
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
