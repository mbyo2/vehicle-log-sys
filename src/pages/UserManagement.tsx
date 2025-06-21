
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserInvitationForm } from "@/components/user/UserInvitationForm";
import { UserRoleManager } from "@/components/user/UserRoleManager";
import { useAuth } from "@/contexts/AuthContext";

export function UserManagement() {
  const { profile } = useAuth();
  const currentProfile = profile.get();

  const canInviteUsers = currentProfile?.role === "super_admin" || currentProfile?.role === "company_admin";

  if (!canInviteUsers) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              You don't have permission to manage users.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user invitations and roles for your organization.
          </p>
        </div>

        <Tabs defaultValue="invite" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invite">Invite Users</TabsTrigger>
            <TabsTrigger value="manage">Manage Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invite New Users</CardTitle>
                <CardDescription>
                  Send invitations to new team members to join your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserInvitationForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Role Management</CardTitle>
                <CardDescription>
                  View and modify user roles within your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserRoleManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
