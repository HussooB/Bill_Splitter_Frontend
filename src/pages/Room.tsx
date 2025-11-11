import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, X } from "lucide-react";

const API_URL = "https://bill-splitter-backend-9b7b.onrender.com/api";

interface Message {
  id?: string;
  senderName: string;
  text?: string;
  proofUrl?: string;
  createdAt: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [roomTitle, setRoomTitle] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("userName") || "You"
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem("token");

  // Scroll to bottom
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  // Sort messages by createdAt
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Fetch room info and messages
  useEffect(() => {
    if (!token) {
      toast({ title: "Unauthorized", description: "Please log in." });
      navigate("/login");
      return;
    }

    const fetchRoom = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch room");
        const data = await res.json();
        const room = data.room;
        setRoomTitle(room.title);
        setMenuItems(
          (room.menu || []).map((item: any, index: number) => ({
            id: index.toString(),
            name: item.name || item,
            price: item.price || 0,
          }))
        );
      } catch (err: any) {
        toast({ title: "Error", description: err.message });
        navigate("/rooms");
      }
    };

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(
          data.messages.map((msg: any) => ({
            id: msg.id,
            senderName: msg.senderName || msg.sender?.name || "Unknown",
            text: msg.text,
            proofUrl: msg.proofUrl || msg.fileUrl,
            createdAt: msg.createdAt || new Date().toISOString(),
          }))
        );
      } catch (err: any) {
        console.error(err);
      }
    };

    fetchRoom();
    fetchMessages();
  }, [roomId, token, toast, navigate]);

  // Initialize Socket.IO
  useEffect(() => {
    if (!token) return;
    const s = io("https://bill-splitter-backend-9b7b.onrender.com", {
      auth: { token },
    });

    s.on("connect", () => console.log("Socket connected:", s.id));
    s.emit("joinRoom", roomId);

    s.on("newMessage", (msg: Message) => {
      if (!msg.createdAt) msg.createdAt = new Date().toISOString();
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    s.on("newProof", (proof: any) => {
      const newMsg: Message = {
        id: proof.id,
        senderName: proof.sender?.name || displayName,
        proofUrl: proof.fileUrl,
        createdAt: proof.createdAt || new Date().toISOString(),
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [roomId, token, displayName]);

  // Unified send: text + optional file
  const handleSend = async () => {
    if (!input.trim() && !file) return;

    // Send text message
    if (input.trim() && socket) {
      const msg = { roomId, senderName: displayName, text: input };
      socket.emit("sendMessage", msg);
      setMessages((prev) => [...prev, { ...msg, createdAt: new Date().toISOString() }]);
      setInput("");
    }

    // Send file
    if (file && token) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_URL}/proofs/${roomId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to upload file");
        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            id: data.proof.id,
            senderName: displayName,
            proofUrl: data.proof.fileUrl,
            createdAt: data.proof.createdAt,
          },
        ]);

        toast({ title: "File sent!" });
        setFile(null);
      } catch (err: any) {
        console.error(err);
        toast({ title: "Error sending file", description: err.message });
      }
    }
  };

  // Total bill calculation
  const totalBill = menuItems.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <header className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{roomTitle}</h1>
          <Button variant="ghost" onClick={() => navigate("/rooms")}>Back</Button>
        </div>

        {/* Room Menu */}
        {menuItems.length > 0 && (
          <div className="mt-2 space-y-1">
            {menuItems.map((item) => (
              <p key={item.id} className="text-sm text-muted-foreground">
                {item.name}: ${item.price.toFixed(2)}
              </p>
            ))}
            <p className="font-bold text-muted-foreground">
              Total: ${totalBill.toFixed(2)}
            </p>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {sortedMessages.map((msg, idx) => (
          <Card key={idx} className="p-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{msg.senderName}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
            {msg.text && <p className="mt-1">{msg.text}</p>}
            {msg.proofUrl && (
              <img src={msg.proofUrl} alt="proof" className="mt-2 max-h-48" />
            )}
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area with improved UX */}
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        {/* Custom file input button */}
        <label className="relative cursor-pointer bg-gray-200 text-[10px] hover:bg-gray-300 px-3 py-2 rounded flex items-center gap-1">
          <Paperclip />
          <span>{file ? file.name : "Attach file"}</span>
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
          />
          {file && (
            <X
              className="ml-2"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            />
          )}
        </label>

        <Button
          onClick={handleSend}
          disabled={!input.trim() && !file} // Send enabled if either exists
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default Room;
