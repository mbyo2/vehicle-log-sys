import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Company } from "@/types/auth";
import { AuditLogList } from "./AuditLogList";

export function CompanyDetails() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCompany = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("id", profile.company_id)
          .single();

        if (error) throw error;
        setCompany(data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [profile?.company_id]);

  const handleUpdate = async (field: string, value: string) => {
    if (!company) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from("companies")
        .update({ [field]: value })
        .eq("id", company.id);

      if (error) throw error;

      setCompany({ ...company, [field]: value });
      toast({
        title: "Success",
        description: "Company details updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!company) {
    return <div>Company not found</div>;
  }

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList>
        <TabsTrigger value="details">Company Details</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="audit">Audit Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>View and update company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                defaultValue={company.name}
                onBlur={(e) => handleUpdate("name", e.target.value)}
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                defaultValue={company.logo_url || ""}
                onBlur={(e) => handleUpdate("logo_url", e.target.value)}
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="primary-color"
                  type="color"
                  defaultValue={company.branding_primary_color || "#000000"}
                  className="w-20"
                  onBlur={(e) =>
                    handleUpdate("branding_primary_color", e.target.value)
                  }
                  disabled={updating}
                />
                <Input
                  value={company.branding_primary_color || ""}
                  onChange={(e) =>
                    handleUpdate("branding_primary_color", e.target.value)
                  }
                  disabled={updating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="secondary-color"
                  type="color"
                  defaultValue={company.branding_secondary_color || "#000000"}
                  className="w-20"
                  onBlur={(e) =>
                    handleUpdate("branding_secondary_color", e.target.value)
                  }
                  disabled={updating}
                />
                <Input
                  value={company.branding_secondary_color || ""}
                  onChange={(e) =>
                    handleUpdate("branding_secondary_color", e.target.value)
                  }
                  disabled={updating}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>Manage company settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Subscription Type</h3>
                  <p className="text-sm text-gray-500">
                    Current plan: {company.subscription_type}
                  </p>
                </div>
                <Button variant="outline">Upgrade Plan</Button>
              </div>

              {company.subscription_type === "trial" && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800">Trial Period</h4>
                  <p className="text-sm text-yellow-700">
                    Started: {company.trial_start_date}
                  </p>
                  <p className="text-sm text-yellow-700">
                    Ends: {company.trial_end_date}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="audit">
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {company && <AuditLogList companyId={company.id} />}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}