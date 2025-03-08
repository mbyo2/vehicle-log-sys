
import { Message } from "@/types/message";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Reply } from "lucide-react";
import { useState } from "react";
import { MessageCompose } from "./MessageCompose";

interface MessageViewProps {
  message: Message;
}

export function MessageView({ message }: MessageViewProps) {
  const [isReplying, setIsReplying] = useState(false);

  // Determine if the message is received (show sender) or sent (show recipient)
  const isSentByCurrentUser = !message.sender_name;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div>
          <div className="text-sm text-muted-foreground">
            {isSentByCurrentUser ? "To:" : "From:"} {isSentByCurrentUser ? message.recipient_name : message.sender_name}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(message.created_at), 'MMM dd, yyyy h:mm a')}
          </div>
        </div>
        
        {!isSentByCurrentUser && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setIsReplying(true)}
          >
            <Reply className="h-4 w-4" />
            Reply
          </Button>
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">{message.subject}</h3>
        <div className="whitespace-pre-line bg-gray-50 p-4 rounded-md">
          {message.content}
        </div>
      </div>
      
      {isReplying && (
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-2">Reply to {message.sender_name}</h4>
          <MessageCompose 
            recipientId={message.sender_id} 
            onSuccess={() => setIsReplying(false)} 
          />
        </div>
      )}
    </div>
  );
}
