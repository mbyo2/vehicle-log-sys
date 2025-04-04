
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Award, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTour } from '@/hooks/useTour';

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { profile } = useAuth();
  const { resetTour } = useTour();
  const userData = profile.get();
  
  useEffect(() => {
    const welcomeDismissed = localStorage.getItem('welcome-banner-dismissed');
    if (userData && !welcomeDismissed) {
      setIsVisible(true);
    }
  }, [userData]);
  
  const handleDismiss = () => {
    localStorage.setItem('welcome-banner-dismissed', 'true');
    setIsVisible(false);
  };
  
  const handleStartTour = () => {
    handleDismiss();
    resetTour();
  };
  
  if (!isVisible) return null;
  
  return (
    <Card className="bg-primary/5 border-primary/20 mb-6 overflow-hidden relative">
      <CardContent className="p-4 sm:p-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2" 
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Award className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-1">
              Welcome to Fleet Manager Beta!
            </h3>
            <p className="text-muted-foreground text-sm mb-3">
              We're excited to have you on board. Take a quick tour to learn about the key features.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleStartTour}>
                Start Tour
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={handleDismiss}>
                <Info className="h-4 w-4" /> 
                Explore on my own
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
