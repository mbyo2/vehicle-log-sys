import { Company } from "@/types/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface CompanyTableProps {
  companies: Company[];
}

export function CompanyTable({ companies }: CompanyTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Subscription</TableHead>
          <TableHead>Trial Period</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies?.map((company) => (
          <TableRow key={company.id}>
            <TableCell>{company.name}</TableCell>
            <TableCell className="capitalize">{company.subscription_type}</TableCell>
            <TableCell>
              {company.trial_start_date && company.trial_end_date ? (
                `${format(new Date(company.trial_start_date), "PP")} - ${format(
                  new Date(company.trial_end_date),
                  "PP"
                )}`
              ) : (
                "N/A"
              )}
            </TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  company.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {company.is_active ? "Active" : "Inactive"}
              </span>
            </TableCell>
            <TableCell>{format(new Date(company.created_at), "PP")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}