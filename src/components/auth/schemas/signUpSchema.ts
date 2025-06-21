
import * as z from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["super_admin", "company_admin", "driver", "supervisor"] as const),
  companyName: z.string().min(2, "Company name must be at least 2 characters").optional(),
  subscriptionType: z.enum(["trial", "full"]).optional(),
}).refine((data) => {
  // If role is company_admin, companyName should be required
  if (data.role === "company_admin") {
    return data.companyName && data.companyName.length >= 2;
  }
  return true;
}, {
  message: "Company name is required for company administrators",
  path: ["companyName"],
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
