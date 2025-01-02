import * as z from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must not exceed 50 characters"),
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must not exceed 50 characters"),
  role: z.enum(["company_admin", "driver"], {
    required_error: "Please select a role",
  }),
  companyName: z.string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .optional(),
  subscriptionType: z.enum(["trial", "full"])
    .optional(),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;