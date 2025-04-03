
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Car, 
  BarChart, 
  FileText, 
  Clock,
  User,
  Wrench,
  MapPin
} from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTour } from '@/hooks/useTour';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function OnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { shouldShowTour, completeTour } = useTour();
  const isMobile = useIsMobile();
  
  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to Fleet Management",
      description: "This quick tour will help you get familiar with the main features of the application.",
      icon: <Car className="h-12 w-12 text-primary" />,
    },
    {
      title: "Vehicle Management",
      description: "Add vehicles to your fleet, track their status, and manage their maintenance schedules.",
      icon: <Car className="h-12 w-12 text-primary" />,
    },
    {
      title: "Trip Logging",
      description: "Record trips with start and end kilometers, track vehicle usage, and manage trip approvals.",
      icon: <MapPin className="h-12 w-12 text-primary" />,
    },
    {
      title: "Maintenance Schedule",
      description: "Set up maintenance schedules for your vehicles to ensure they remain in good condition.",
      icon: <Wrench className="h-12 w-12 text-primary" />,
    },
    {
      title: "Driver Management",
      description: "Add drivers, assign vehicles, and track driver performance and certifications.",
      icon: <User className="h-12 w-12 text-primary" />,
    },
    {
      title: "Reports & Analytics",
      description: "View reports and analytics to make informed decisions about your fleet management.",
      icon: <BarChart className="h-12 w-12 text-primary" />,
    },
    {
      title: "Document Management",
      description: "Store and manage important documents related to vehicles, drivers, and your company.",
      icon: <FileText className="h-12 w-12 text-primary" />,
    },
    {
      title: "Ready to Go!",
      description: "You're now ready to start using the application. You can always access the help section for more information.",
      icon: <Clock className="h-12 w-12 text-primary" />,
    },
  ];

  useEffect(() => {
    if (shouldShowTour) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowTour]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    completeTour();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[80%]" : "max-w-md"}
        >
          <SheetHeader>
            <SheetTitle>
              Fleet Management Tutorial
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4" 
                onClick={handleComplete}
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
            <SheetDescription>
              Step {currentStep + 1} of {tutorialSteps.length}
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col items-center justify-center mt-6 space-y-6">
            {tutorialSteps[currentStep].icon}
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">
                {tutorialSteps[currentStep].title}
              </h3>
              <p className="text-muted-foreground">
                {tutorialSteps[currentStep].description}
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-2 mt-4">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentStep ? "bg-primary" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          
          <SheetFooter className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            
            <Button onClick={handleNext}>
              {currentStep === tutorialSteps.length - 1 ? (
                "Finish"
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      <Card className="fixed bottom-4 right-4 z-50 shadow-lg bg-white dark:bg-gray-800 hidden md:block">
        <CardContent className="p-4">
          <Button onClick={() => setIsOpen(true)}>
            Take a Tour
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
