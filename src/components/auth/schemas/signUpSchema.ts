
import * as z from "zod";
import { UserRole } from "@/types/auth";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["super_admin", "company_admin", "driver", "supervisor"] as const),
  companyName: z.string().min(2, "Company name must be at least 2 characters").optional(),
  subscriptionType: z.enum(["trial", "full"]).optional(),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
