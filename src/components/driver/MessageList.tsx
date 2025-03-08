
import { useState } from "react";
import { useMessages } from "@/hooks/useMessages";
import { Message } from "@/types/message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { MessageCompose } from "./MessageCompose";
import { MessageView } from "./MessageView";
import { Mail, Send, Archive, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MessageList() {
  const { receivedMessages, sentMessages, isLoading, markAsRead } = useMessages();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReceived = receivedMessages?.filter(
    message => 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSent = sentMessages?.filter(
    message => 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsViewOpen(true);
    if (!message.is_read && message.recipient_id === message.sender_id) {
      markAsRead.mutate(message.id);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-60">Loading messages...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Messages</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="mr-2 h-4 w-4" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Compose Message</DialogTitle>
              </DialogHeader>
              <MessageCompose onSuccess={() => setIsComposeOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList>
          <TabsTrigger value="inbox" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Inbox
            {receivedMessages?.filter(m => !m.is_read).length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {receivedMessages.filter(m => !m.is_read).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center">
            <Send className="mr-2 h-4 w-4" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center">
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReceived && filteredReceived.length > 0 ? (
                <div className="space-y-2 divide-y">
                  {filteredReceived.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex items-center py-2 cursor-pointer hover:bg-gray-50 ${!message.is_read ? 'font-semibold' : ''}`}
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div>
                            {!message.is_read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                            )}
                          </div>
                          <div>From: {message.sender_name}</div>
                        </div>
                        <div className="text-sm font-medium">{message.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'MMM dd, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No messages match your search." : "No messages in your inbox."}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSent && filteredSent.length > 0 ? (
                <div className="space-y-2 divide-y">
                  {filteredSent.map((message) => (
                    <div 
                      key={message.id} 
                      className="flex items-center py-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex-1">
                        <div>To: {message.recipient_name}</div>
                        <div className="text-sm font-medium">{message.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'MMM dd, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No messages match your search." : "No sent messages."}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="archive">
          <Card>
            <CardHeader>
              <CardTitle>Archived Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Archive feature coming soon.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Message</DialogTitle>
          </DialogHeader>
          {selectedMessage && <MessageView message={selectedMessage} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
