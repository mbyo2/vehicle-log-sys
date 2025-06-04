
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { HelpCenter } from "@/components/onboarding/HelpCenter";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user } = useAuth();
  const isAuthenticated = !!user.get();
  
  return (
    <>
      {children}
      {isAuthenticated && (
        <>
          <OnboardingTutorial />
          <HelpCenter />
        </>
      )}
    </>
  );
}
