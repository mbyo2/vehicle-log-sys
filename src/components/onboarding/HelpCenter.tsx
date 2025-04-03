
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  Book, 
  FileText, 
  Video, 
  MessageCircle,
  ThumbsUp
} from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTour } from '@/hooks/useTour';

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { resetTour } = useTour();
  
  const faqItems = [
    {
      question: "How do I add a new vehicle?",
      answer: "Navigate to the Fleet page and click on the 'Add Vehicle' button. Fill in the required information and save."
    },
    {
      question: "How do I log a trip?",
      answer: "Go to the Trip Management page and click 'Log New Trip'. Enter the vehicle details, start and end kilometers, and submit the form."
    },
    {
      question: "How do I schedule maintenance?",
      answer: "Access the Maintenance page and click 'Schedule Maintenance'. Choose the vehicle, service type, and date, then submit."
    },
    {
      question: "Can I use the app offline?",
      answer: "Yes, the app has offline capabilities. Your data will be saved locally and synchronized when you're back online."
    },
    {
      question: "How do I view reports?",
      answer: "Navigate to the Reports page where you can view and generate various reports about your fleet operations."
    },
  ];
  
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 h-10 w-10 rounded-full shadow-lg z-50"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[80%]" : "max-w-sm"}>
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <HelpCircle className="mr-2" /> Help Center
            </SheetTitle>
            <SheetDescription>
              Find help and resources for using the fleet management system.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Book className="h-4 w-4 mr-2" /> Quick Resources
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" /> User Guide
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => resetTour()}>
                  <Video className="h-4 w-4 mr-2" /> Restart Tour
                </Button>
                <Button variant="outline" className="justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" /> Contact Support
                </Button>
                <Button variant="outline" className="justify-start">
                  <ThumbsUp className="h-4 w-4 mr-2" /> Give Feedback
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Frequently Asked Questions</h3>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          
          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button type="submit">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
