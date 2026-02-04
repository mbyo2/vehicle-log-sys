import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Copy, Key, Search, User, Check } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
}

export function AdminPasswordReset() {
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<{ userId: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const currentProfile = profile.get();
  
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-list", currentProfile?.company_id],
    queryFn: async () => {
      if (!currentProfile) return [];

      let query = supabase.from("profiles").select("id, email, full_name, company_id");

      // Super admins see all users, company admins see only their company
      if (currentProfile.role !== "super_admin") {
        query = query.eq("company_id", currentProfile.company_id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserWithRole[];
    },
    enabled: !!currentProfile,
  });

  const generateResetLink = async (userId: string, userEmail: string) => {
    try {
      setGeneratingFor(userId);
      setResetLink(null);

      const { data, error } = await supabase.functions.invoke("admin-auth-tools", {
        body: {
          action: "generate_reset_link",
          email: userEmail,
          redirectTo: `${window.location.origin}/reset-password`,
        },
      });

      if (error) throw error;
      if (!data?.actionLink) throw new Error("No reset link returned");

      setResetLink({ userId, link: data.actionLink as string });
      
      toast({
        title: "Reset link generated",
        description: `Share this link with ${userEmail} to set a new password.`,
      });
    } catch (error: any) {
      console.error("Error generating reset link:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate password reset link",
      });
    } finally {
      setGeneratingFor(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Reset link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Password Reset Management
        </CardTitle>
        <CardDescription>
          Generate password reset links for users who forgot their passwords
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reset Link Display */}
        {resetLink && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Password Reset Link Generated:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background p-2 rounded border overflow-x-auto">
                {resetLink.link}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(resetLink.link)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with the user. It opens a secure Supabase recovery flow.
            </p>
          </div>
        )}

        {/* User List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers?.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{user.full_name || "No name"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.id === currentProfile?.id && (
                    <Badge variant="outline">You</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateResetLink(user.id, user.email)}
                    disabled={generatingFor === user.id || user.id === currentProfile?.id}
                  >
                    {generatingFor === user.id ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-1" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
