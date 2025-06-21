
import * as z from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["super_admin", "company_admin", "driver", "supervisor"] as const),
  companyName: z.string().optional(),
  subscriptionType: z.enum(["trial", "full"]).optional(),
}).refine((data) => {
  // If role is company_admin and not first user, companyName should be required
  if (data.role === "company_admin" && data.companyName !== undefined) {
    return !data.companyName || data.companyName.length >= 2;
  }
  return true;
}, {
  message: "Company name must be at least 2 characters",
  path: ["companyName"],
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
