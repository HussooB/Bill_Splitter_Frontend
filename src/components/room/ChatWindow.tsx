import { useEffect, useState, KeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "https://bill-splitter-backend-9b7b.onrender.com/api";

interface Message {
  id: number;
  text: string;
  sender: string;
  createdAt: string;
  isCurrentUser: boolean;
}

interface BackendMessage {
  id: number;
  text: string;
  roomId: number;
  userId: number;
  createdAt: string;
  user?: { name: string };
}

interface ChatWindowProps {
  roomId: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId }) => {
  const { toast } = useToast();
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  // ✅ Fetch all messages for this room
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token) {
          toast({ title: "Unauthorized", description: "Please log in." });
          return;
        }

        const res = await fetch(`${API_URL}/messages/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();

        const formatted: Message[] = data.messages.map(
          (msg: BackendMessage) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.user?.name || `User ${msg.userId}`,
            createdAt: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isCurrentUser: msg.userId === Number(userId),
          })
        );

        setMessages(formatted);
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchMessages();
  }, [roomId, toast]);

  // ✅ Send message to backend
  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "Unauthorized", description: "Please log in." });
        return;
      }

      const res = await fetch(`${API_URL}/messages/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: message }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();

      const newMessage: Message = {
        id: data.message.id,
        sender: "You",
        text: data.message.text,
        createdAt: new Date(data.message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isCurrentUser: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage("");

      toast({
        title: "Message sent",
        description: "Your message has been sent to the room.",
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Send failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // ✅ Handle Enter key to send
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="p-6 h-[600px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Chat</h2>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.isCurrentUser ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.isCurrentUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {!msg.isCurrentUser && (
                <p className="text-xs font-semibold mb-1 opacity-70">
                  {msg.sender}
                </p>
              )}
              <p className="text-sm">{msg.text}</p>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {msg.createdAt}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button onClick={handleSend} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ChatWindow;
