import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { HelpCenter } from "@/components/onboarding/HelpCenter";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user } = useAuth();
  const currentUser = user.get();
  const isAuthenticated = !!currentUser;
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  // Check if email is verified
  const isEmailVerified = currentUser?.email_confirmed_at != null;
  const shouldShowBanner = isAuthenticated && !isEmailVerified && !bannerDismissed;
  
  return (
    <>
      {shouldShowBanner && currentUser?.email && (
        <div className="sticky top-0 z-50">
          <EmailVerificationBanner 
            userEmail={currentUser.email} 
            onDismiss={() => setBannerDismissed(true)}
          />
        </div>
      )}
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
