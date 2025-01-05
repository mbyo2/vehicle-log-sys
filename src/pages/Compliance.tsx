import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLogList } from "@/components/company/AuditLogList";
import { ComplianceReports } from "@/components/compliance/ComplianceReports";
import { useAuth } from "@/contexts/AuthContext";

export function Compliance() {
  const { profile } = useAuth();

  if (!profile?.company_id) {
    return <div>No company associated with this account</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Audit & Compliance</h1>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogList companyId={profile.company_id} />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}