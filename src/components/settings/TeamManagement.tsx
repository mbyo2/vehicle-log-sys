import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UserInviteDialog } from "@/components/auth/UserInviteDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Trash2, Mail } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
  created_at: string;
  roles: Array<{
    role: string;
    company_id: string | null;
  }>;
}

export function TeamManagement() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const currentProfile = profile.get();

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-members", currentProfile?.company_id],
    queryFn: async () => {
      if (!currentProfile?.company_id) return [];

      // Fetch profiles and their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_id, created_at")
        .eq("company_id", currentProfile.company_id)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const userIds = profiles.map((p) => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role, company_id")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const membersWithRoles = profiles.map((profile) => ({
        ...profile,
        roles: roles.filter((r) => r.user_id === profile.id),
      }));

      return membersWithRoles as TeamMember[];
    },
    enabled: !!currentProfile?.company_id,
  });

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!currentProfile?.company_id) return;

    try {
      setUpdatingUserId(userId);

      // Update the user role in user_roles table
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("company_id", currentProfile.company_id);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update user role.",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !currentProfile?.company_id) return;

    try {
      // Remove user role for this company
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userToDelete.id)
        .eq("company_id", currentProfile.company_id);

      if (roleError) throw roleError;

      // If this is the only company for the user, remove their profile association
      const { data: otherRoles } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userToDelete.id);

      if (!otherRoles || otherRoles.length === 0) {
        await supabase
          .from("profiles")
          .update({ company_id: null })
          .eq("id", userToDelete.id);
      }

      toast({
        title: "User removed",
        description: "User has been removed from your team.",
      });

      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast({
        variant: "destructive",
        title: "Removal failed",
        description: error.message || "Failed to remove user.",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
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

  const formatRoleName = (role: string) => {
    return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getUserRole = (member: TeamMember) => {
    const companyRole = member.roles.find((r) => r.company_id === currentProfile?.company_id);
    return companyRole?.role || member.roles[0]?.role || "driver";
  };

  const canManageRoles =
    currentProfile?.role === "super_admin" || currentProfile?.role === "company_admin";

  const availableRoles =
    currentProfile?.role === "super_admin"
      ? ["company_admin", "supervisor", "driver"]
      : currentProfile?.role === "company_admin"
      ? ["supervisor", "driver"]
      : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>Manage team members and their roles</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner className="h-8 w-8" />
        </CardContent>
      </Card>
    );
  }

  if (!canManageRoles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>Manage team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground p-8">
            You don't have permission to manage team members.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Manage team members and their roles ({teamMembers?.length || 0} members)
              </CardDescription>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!teamMembers || teamMembers.length === 0 ? (
            <div className="text-center p-8 border rounded-lg border-dashed">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your team by inviting users
              </p>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Your First User
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => {
                    const userRole = getUserRole(member);
                    const isCurrentUser = member.id === currentProfile?.id;

                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.full_name || "N/A"}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {!isCurrentUser && canManageRoles ? (
                            <Select
                              value={userRole}
                              onValueChange={(newRole) => updateUserRole(member.id, newRole)}
                              disabled={updatingUserId === member.id}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue>
                                  <Badge variant={getRoleBadgeVariant(userRole)}>
                                    {formatRoleName(userRole)}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {availableRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {formatRoleName(role)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={getRoleBadgeVariant(userRole)}>
                              {formatRoleName(userRole)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isCurrentUser && canManageRoles && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(member);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["team-members"] });
          setInviteDialogOpen(false);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToDelete?.full_name || userToDelete?.email} from
              your team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
