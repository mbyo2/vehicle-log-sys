import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDocuments } from "@/hooks/useDocuments";
import { useTrainings } from "@/hooks/useTrainings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import {
  ArrowLeft,
  FileText,
  GraduationCap,
  IdCard,
  Mail,
  Upload,
  Eye,
} from "lucide-react";

export default function DriverDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const profileData = profile.get();
  const companyId = profileData?.company_id;
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: driver, isLoading: isLoadingDriver } = useQuery({
    queryKey: ["driver", id],
    queryFn: async () => {
      const { data: drv, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!drv) return null;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", drv.profile_id)
        .maybeSingle();

      return {
        ...drv,
        profile: prof || { id: drv.profile_id, full_name: "Unknown", email: "" },
      };
    },
    enabled: !!id,
  });

  const { documents, isLoading: isLoadingDocs } = useDocuments();
  const { driverTrainings, isLoading: isLoadingTrainings } = useTrainings();

  const driverDocuments = useMemo(
    () =>
      (documents || []).filter(
        (d: any) => d.driver_id === driver?.profile_id || d.driver_id === driver?.id
      ),
    [documents, driver]
  );

  const driverTrainingsFiltered = useMemo(
    () =>
      (driverTrainings || []).filter(
        (t) => t.driver_id === driver?.profile_id || t.driver_id === driver?.id
      ),
    [driverTrainings, driver]
  );

  if (isLoadingDriver) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/drivers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to drivers
        </Button>
        <EmptyState
          icon={IdCard}
          title="Driver not found"
          description="This driver may have been removed or you don't have access."
        />
      </div>
    );
  }

  const licenseExpiringSoon =
    driver.license_expiry &&
    new Date(driver.license_expiry).getTime() - Date.now() <
      30 * 24 * 60 * 60 * 1000;
  const licenseExpired =
    driver.license_expiry && new Date(driver.license_expiry) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/drivers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">{driver.profile.full_name}</CardTitle>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" /> {driver.profile.email}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm">
                MAN: {driver.man_number}
              </Badge>
              {driver.license_number && (
                <Badge variant="outline" className="text-sm">
                  License: {driver.license_number}
                </Badge>
              )}
              {licenseExpired ? (
                <Badge variant="destructive">License expired</Badge>
              ) : licenseExpiringSoon ? (
                <Badge className="bg-yellow-500 text-white">License expiring soon</Badge>
              ) : driver.license_expiry ? (
                <Badge className="bg-green-600 text-white">License valid</Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">License Number</dt>
              <dd className="font-medium">{driver.license_number || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">License Expiry</dt>
              <dd className="font-medium">
                {driver.license_expiry
                  ? format(new Date(driver.license_expiry), "PP")
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">MAN Number</dt>
              <dd className="font-medium">{driver.man_number}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Joined</dt>
              <dd className="font-medium">
                {format(new Date(driver.created_at), "PP")}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="trainings">
        <TabsList>
          <TabsTrigger value="trainings">
            <GraduationCap className="mr-2 h-4 w-4" />
            Trainings ({driverTrainingsFiltered.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documents ({driverDocuments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trainings">
          <Card>
            <CardHeader>
              <CardTitle>Driver Trainings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTrainings ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size={24} />
                </div>
              ) : driverTrainingsFiltered.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No trainings recorded"
                  description="This driver has no training certifications on file yet."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Certificate #</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverTrainingsFiltered.map((t) => {
                      const expired = t.expiry_date && new Date(t.expiry_date) < new Date();
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            {t.course?.title || "—"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(t.completion_date), "PP")}
                          </TableCell>
                          <TableCell>
                            {t.expiry_date ? (
                              <span className={expired ? "text-destructive" : ""}>
                                {format(new Date(t.expiry_date), "PP")}
                              </span>
                            ) : (
                              "No expiry"
                            )}
                          </TableCell>
                          <TableCell>{t.certificate_number || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Driver Documents</CardTitle>
              {companyId && (
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Driver Document</DialogTitle>
                      <DialogDescription>
                        Upload a document for {driver.profile.full_name}.
                      </DialogDescription>
                    </DialogHeader>
                    <DocumentUpload
                      companyId={companyId}
                      driverId={driver.profile_id}
                      onSuccess={() => setUploadOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingDocs ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size={24} />
                </div>
              ) : driverDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents uploaded"
                  description="Upload license copies, certifications, or other driver documents."
                  action={
                    companyId ? (
                      <Button onClick={() => setUploadOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverDocuments.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell className="capitalize">
                          {doc.type?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              doc.verification_status === "verified"
                                ? "default"
                                : doc.verification_status === "rejected"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {doc.verification_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {doc.expiry_date
                            ? format(new Date(doc.expiry_date), "PP")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {doc.file_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              aria-label={`View ${doc.name}`}
                            >
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
