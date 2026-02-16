import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserInvitationForm } from "@/components/auth/UserInvitationForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, User, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRoleManagement } from "@/hooks/useRoleManagement";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
  role: UserRole;
}

export function Users() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { profile } = useAuth();
  const { hasRole, updateUserRole, getAssignableRoles } = useRoleManagement();
  const assignableRoles = getAssignableRoles();

  const fetchUsers = async () => {
    const currentProfile = profile.get();
    if (!currentProfile) return;

    try {
      setLoading(true);

      // Fetch profiles
      let profileQuery = supabase.from("profiles").select("*");
      
      if (hasRole('company_admin') && !hasRole('super_admin')) {
        if (currentProfile.company_id) {
          profileQuery = profileQuery.eq("company_id", currentProfile.company_id);
        }
      }

      const { data: profiles, error: profileError } = await profileQuery;
      if (profileError) throw profileError;
      if (!profiles) { setUsers([]); return; }

      // Fetch roles for all users
      const userIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      const roleMap = new Map<string, UserRole>();
      roles?.forEach(r => {
        if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role as UserRole);
      });

      setUsers(profiles.map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        company_id: p.company_id,
        role: roleMap.get(p.id) || "driver",
      })));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [profile, hasRole]);

  const handleRoleChange = async (userId: string) => {
    if (!selectedRole) return;
    
    const success = await updateUserRole(userId, selectedRole);
    
    if (success) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: selectedRole } : user
      ));
      setEditingUserId(null);
      setSelectedRole(null);
    }
  };

  const startEditing = (user: UserWithRole) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setSelectedRole(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner className="w-8 h-8" />
        </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage users and their roles across the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No users yet</h3>
                    <p className="text-muted-foreground">
                      Start by inviting users to join your company
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || "Unnamed"}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <Select 
                              value={selectedRole || undefined}
                              onValueChange={(value) => setSelectedRole(value as UserRole)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {assignableRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleRoleChange(user.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {user.role.replace('_', ' ')}
                            </Badge>
                            {hasRole(['super_admin', 'company_admin']) && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => startEditing(user)}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Invite Users</CardTitle>
                <CardDescription>
                  Send invitations to new users to join your company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserInvitationForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default Users;
