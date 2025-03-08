import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useMessages } from "@/hooks/useMessages";
import { Send } from "lucide-react";

interface MessageComposeProps {
  recipientId?: string;
  onSuccess?: () => void;
}

export function MessageCompose({ recipientId, onSuccess }: MessageComposeProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendMessage } = useMessages();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !content.trim() || !recipientId) {
      toast({
        title: "Error",
        description: "Please complete all fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await sendMessage.mutateAsync({
        recipient_id: recipientId,
        subject: subject,
        content: content,
      });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      
      setSubject("");
      setContent("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <Textarea
          placeholder="Type your message here..."
          className="min-h-[120px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || !subject.trim() || !content.trim()}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </form>
  );
}
