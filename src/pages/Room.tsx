import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, X } from "lucide-react";

const API_URL = "https://bill-splitter-backend-9b7b.onrender.com/api";
const SOCKET_URL = "https://bill-splitter-backend-9b7b.onrender.com";

interface Message {
  id: string;
  senderName: string;
  text?: string;
  proofUrl?: string;
  createdAt: string;
  roomId?: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [roomTitle, setRoomTitle] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [displayName] = useState(localStorage.getItem("userName") || "You");

  const token = localStorage.getItem("token");

  const normalizeUserList = (users: string[]) =>
    Array.from(new Set(users.filter((u) => u && u.trim() && u !== displayName)));

  // autoscroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // fetch room + messages
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
          data.messages
            .map((msg: any) => ({
              id: msg.id,
              senderName: msg.senderName || msg.sender?.name || "Unknown",
              text: msg.text,
              proofUrl: msg.proofUrl || msg.fileUrl,
              createdAt: msg.createdAt || new Date().toISOString(),
            }))
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
        );
      } catch (err) {
        console.error(err);
      }
    };

    fetchRoom();
    fetchMessages();
  }, [roomId, token, toast, navigate]);

  // ------------------ SOCKET LOGIC ------------------
  
  useEffect((): (() => void) => {
  if (!token) return () => {}; // Return empty cleanup if no token

  // Initialize socket
  const s: Socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  });

  // Connect
  s.on("connect", () => {
    console.log("Socket connected:", s.id);
    s.emit("joinRoom", roomId, displayName);
  });

  s.on("connect_error", (err) => console.error("Socket connect error:", err));

  // User list updates
  s.on("userList", (users: string[]) => setOnlineUsers(normalizeUserList(users)));

  s.on("userJoined", (name: string) => {
    if (name !== displayName) toast({ title: `${name} joined the room` });
  });

  s.on("userLeft", (name: string) => {
    if (name !== displayName) toast({ title: `${name} left the room` });
    setOnlineUsers((prev) => normalizeUserList(prev.filter((u) => u !== name)));
  });

  // Messages
  s.on("receiveMessage", (msg: Message) => {
    if (msg.senderName === displayName) return;
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  });

  s.on("receiveProof", (proof: Message) => {
    setMessages((prev) =>
      prev.some((m) => m.id === proof.id) ? prev : [...prev, proof]
    );
  });

  setSocket(s);

  // Cleanup function
  return () => {
    s.disconnect();
  };
}, [roomId, token, displayName, toast]);

  // ------------------ SEND MESSAGE / FILE ------------------
  const handleSend = async () => {
    if (!socket || (!input.trim() && !file)) return;

    if (input.trim()) {
      const msg: Message = {
        id: crypto.randomUUID(),
        senderName: displayName,
        text: input.trim(),
        createdAt: new Date().toISOString(),
        roomId,
      };
      setMessages((prev) => [...prev, msg]);
      socket.emit("sendMessage", msg);
      setInput("");
    }

    if (file) {
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
        const proofMsg: Message = {
          id: data.proof.id,
          senderName: displayName,
          proofUrl: data.proof.fileUrl,
          createdAt: data.proof.createdAt,
          roomId,
        };

        socket.emit("sendProof", proofMsg);
        setMessages((prev) =>
          prev.some((m) => m.id === proofMsg.id) ? prev : [...prev, proofMsg]
        );

        setFile(null);
        toast({ title: "File sent!" });
      } catch (err: any) {
        console.error(err);
        toast({ title: "Error sending file", description: err.message });
      }
    }
  };

  const totalBill = menuItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalParticipants = 1 + onlineUsers.length;
  const eachShare = totalParticipants > 0 ? totalBill / totalParticipants : totalBill;

  // ------------------ UI ------------------
// ------------------ UI ------------------
return (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 via-background/5 to-accent/10 p-4">

    {/* Room Title */}
    <header className="mb-4 relative flex flex-col items-center">
      <h1
        className="text-5xl font-extrabold text-primary mb-4"
        style={{ fontFamily: "'Berkshire Swash', cursive" }}
      >
        {roomTitle || "Room"}
      </h1>

      <div className="absolute top-0 right-0 mt-2 mr-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/rooms")}>
          Back
        </Button>
      </div>

      {/* Online users + Items Selected */}
      <div className="flex justify-between items-start gap-2 w-full px-2">
        {/* Online box */}
        <div className="bg-green-50 text-green-700 rounded-lg px-4 py-2 border border-green-200 shadow-sm text-base min-w-[150px]">
          <span className="font-semibold">Online:</span>{" "}
          <span>
            You{onlineUsers.length ? ", " + onlineUsers.join(", ") : ""}
          </span>
        </div>

        {/* Items Selected box */}
        {menuItems.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 shadow-sm rounded-lg flex-1 max-w-[70%] p-4 text-center">
            <p className="font-semibold text-lg text-yellow-700 mb-2">Items Selected</p>
            {menuItems.map((item) => (
              <p key={item.id} className="text-sm text-muted-foreground">
                {item.name}: ${item.price.toFixed(2)}
              </p>
            ))}
            <p className="mt-2 text-base font-semibold text-yellow-700">
              Total: ${totalBill.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </header>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto mb-4 px-2">
      <div className="space-y-3 max-w-5xl mx-auto">
        {messages.map((msg) => {
          const isMine = msg.senderName === displayName;
          return (
            <div
              key={msg.id}
              className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`p-2 w-full md:w-[60%] border text-sm ${
                  isMine
                    ? "bg-primary/80 text-white border-primary/70 rounded-tr-2xl rounded-bl-2xl shadow-md"
                    : "bg-green-100 text-green-900 border-green-200 rounded-tl-2xl rounded-br-2xl shadow-sm"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">
                    {isMine ? "You" : msg.senderName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {msg.text && <p className="mt-1">{msg.text}</p>}
                {msg.proofUrl && (
                  <img
                    src={msg.proofUrl}
                    alt="proof"
                    className="mt-2 max-h-52 rounded border border-muted/50 object-contain"
                  />
                )}
              </Card>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>

    {/* Input bar */}
    <div className="flex gap-2 items-center max-w-5xl mx-auto w-full bg-white border-t border-muted/30 p-2 rounded-tl-lg rounded-tr-lg shadow-md">
      <Input
        placeholder="Type a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        className="flex-1"
      />
      <label className="relative cursor-pointer bg-gray-100 hover:bg-gray-200 text-[10px] px-3 py-2 rounded flex items-center gap-1 border border-gray-300 shadow-sm">
        <Paperclip size={14} />
        <span>{file ? file.name : "Attach"}</span>
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
      <Button onClick={handleSend} disabled={!input.trim() && !file}>
        Send
      </Button>
    </div>
  </div>
);

};

export default Room;
