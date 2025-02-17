
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserInvitationForm } from "@/components/auth/UserInvitationForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("company_id", profile.company_id);

        if (error) throw error;
        setUsers(data);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [profile?.company_id]);

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
              <CardTitle>Company Users</CardTitle>
              <CardDescription>
                Manage users and their roles within your company
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
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
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
  );
}
