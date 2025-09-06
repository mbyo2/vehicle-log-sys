import * as z from "zod";
import { SecurityUtils } from "@/lib/security";

// Custom password validation using SecurityUtils
const passwordValidation = z.string().refine(
  (password) => {
    const validation = SecurityUtils.validatePassword(password);
    return validation.isValid;
  },
  {
    message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
  }
);

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: passwordValidation,
  rememberMe: z.boolean().default(false),
});

export type SignInFormValues = z.infer<typeof signInSchema>;