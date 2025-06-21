
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/icons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { signUpSchema, type SignUpFormValues } from "./schemas/signUpSchema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface SignUpFormFieldsProps {
  onSubmit: (values: SignUpFormValues) => Promise<void>;
  loading: boolean;
  isFirstUser?: boolean;
}

export function SignUpFormFields({ onSubmit, loading, isFirstUser }: SignUpFormFieldsProps) {
  const [password, setPassword] = useState("");
  
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: isFirstUser ? "super_admin" : "company_admin",
      companyName: isFirstUser ? "" : "",
      subscriptionType: isFirstUser ? undefined : "trial",
    },
  });

  const watchRole = form.watch("role");

  const handleFormSubmit = async (values: SignUpFormValues) => {
    console.log("Form submitted with values:", { ...values, isFirstUser });
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Error during form submission:", error);
    }
  };

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    disabled={loading}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setPassword(e.target.value);
                    }}
                  />
                </FormControl>
                <PasswordStrengthMeter password={password} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {!isFirstUser && (
            <>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Role
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Company Admin: Can manage the company and invite users</p>
                          <p>Driver/Supervisor: Must be invited by a Company Admin</p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="company_admin">Company Admin</SelectItem>
                        <SelectItem value="driver" disabled>Driver (Invitation Required)</SelectItem>
                        <SelectItem value="supervisor" disabled>Supervisor (Invitation Required)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {watchRole === "company_admin" && (
                <>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your company name"
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subscriptionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Subscription Type
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Trial: 25 days of free access to test the platform</p>
                              <p>Full: Unlimited access with all features</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <Select
                          disabled={loading}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subscription type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="trial">Trial (25 days free)</SelectItem>
                            <SelectItem value="full">Full Access</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </>
          )}
          <Button
            type="submit"
            className="w-full mt-6"
            disabled={loading}
          >
            {loading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isFirstUser ? 'Create Super Admin Account' : 'Create Account & Company'}
          </Button>
        </form>
      </Form>
    </TooltipProvider>
  );
}
