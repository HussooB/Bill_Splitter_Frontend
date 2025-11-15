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
// Hash username → stable color index (0–9)
const userColorMap: Record<string, string> = {};

const COLORS = [
  "from-purple-200 to-purple-300 border-purple-400 text-purple-900",
  "from-orange-200 to-orange-300 border-orange-400 text-orange-900",
  "from-teal-200 to-teal-300 border-teal-400 text-teal-900",
  "from-pink-200 to-pink-300 border-pink-400 text-pink-900",
  "from-red-200 to-red-300 border-red-400 text-red-900",
  "from-indigo-200 to-indigo-300 border-indigo-400 text-indigo-900",
  "from-amber-200 to-amber-300 border-amber-400 text-amber-900",
  "from-cyan-200 to-cyan-300 border-cyan-400 text-cyan-900",
  "from-lime-200 to-lime-300 border-lime-400 text-lime-900",
  "from-rose-200 to-rose-300 border-rose-400 text-rose-900"
];

// Assign a color based on name
function getColorForUser(name: string) {
  if (userColorMap[name]) return userColorMap[name];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash % COLORS.length);
  userColorMap[name] = COLORS[index];
  return COLORS[index];
}

  // ------------------ UI ------------------
// ------------------- UI -------------------
return (
  <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50 p-5">

    {/* ===== ROOM TITLE ===== */}
    <h1
      className="text-5xl font-extrabold text-center mb-8 text-blue-700 drop-shadow"
      style={{ fontFamily: "'Berkshire Swash', cursive" }}
    >
      {roomTitle || "Room"}
    </h1>

    {/* ===== TOP BAR ===== */}
    <div className="w-full max-w-5xl mx-auto flex items-start justify-between gap-6 mb-6">

      {/* ---- ONLINE BOX ---- */}
      <div className="w-1/3 bg-green-100 border border-green-300 rounded-2xl p-5 shadow-lg">
        <p className="font-semibold text-xl text-green-700 mb-2">Online</p>

        <p className="text-green-900 text-base leading-relaxed">
          <span className="font-bold">You</span>
          {onlineUsers.length ? ", " + onlineUsers.join(", ") : ""}
        </p>

        <p className="font-semibold mt-3 text-green-800">
          Total: {1 + onlineUsers.length}
        </p>
      </div>

      {/* ---- ITEMS SELECTED ---- */}
      {menuItems.length > 0 && (
        <div className="w-2/3 bg-yellow-50 border border-yellow-300 rounded-2xl p-5 shadow-lg">
          <p className="font-semibold text-xl text-yellow-700 mb-3">
            Items Selected
          </p>

          {/* Inline items (comma separated) */}
          <p className="text-md font-semibold text-gray-800 mb-4">
            {menuItems.map((i) => `${i.name} (${i.price.toFixed(2)} birr)`).join(", ")} 
          </p>

          <div className="flex justify-between items-center pt-3 border-t border-yellow-300">
            <p className="text-lg font-bold text-yellow-700">
              Total: {totalBill.toFixed(2)} birr
            </p>
            <p className="text-md font-bold text-yellow-600">
              Each User Pays: {(totalBill / (onlineUsers.length + 1)).toFixed(2)} birr
            </p>
          </div>
        </div>
      )}
    </div>

    {/* ===== MESSAGES SECTION ===== */}
    <div className="flex-1 overflow-y-auto px-2 w-full max-w-4xl mx-auto">
      <div className="space-y-5">

        {messages.map((msg) => {
          const isMine = msg.senderName === displayName;
          const avatar = isMine ? "Y" : msg.senderName.charAt(0).toUpperCase();
          const bubbleColor = isMine
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-300 rounded-br-none"
            : `bg-gradient-to-br ${getColorForUser(msg.senderName)} rounded-bl-none`;

          const avatarColor = isMine
            ? "bg-blue-200 text-blue-700"
            : "bg-green-300 text-green-900";

          return (
            <div
              key={msg.id}
              className={`flex w-full items-end gap-2 ${
                isMine ? "justify-end" : "justify-start"
              } animate-[fadeInUp_0.3s_ease]`}
            >

              {/* Avatar */}
              {!isMine && (
                <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center shadow ${avatarColor}`}>
                  {avatar}
                </div>
              )}

              {/* Bubble */}
              <div className={`p-4 max-w-[75%] rounded-3xl shadow-lg border ${bubbleColor}`}>
                {/* Header */}
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold mr-1 text-sm">
                    {isMine ? "You" : msg.senderName}
                  </span>
                  <span className="text-xs opacity-75">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Message */}
                {msg.text && (
                  <p className="mt-1 text-sm leading-relaxed">
                    {msg.text}
                  </p>
                )}

                {/* Attachment */}
                {msg.proofUrl && (
                  <img
                    src={msg.proofUrl}
                    alt="attachment"
                    className="mt-3 max-h-60 rounded-lg border object-contain shadow-sm"
                  />
                )}
              </div>

              {/* My avatar */}
              {isMine && (
                <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center shadow ${avatarColor}`}>
                  {avatar}
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
    </div>

    {/* ===== INPUT BAR ===== */}
    <div className="flex gap-3 items-center max-w-4xl mx-auto w-full bg-white border rounded-2xl p-3 shadow-xl mt-4 mb-2">

      <Input
        placeholder="Type a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        className="flex-1"
      />

      {/* File picker */}
      <label className="relative cursor-pointer bg-gray-100 hover:bg-gray-200 text-xs px-3 py-2 rounded-lg border shadow-sm flex items-center">
        <Paperclip size={15} />
        <span className="ml-1">{file ? file.name : "Attach"}</span>

        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => e.target.files && setFile(e.target.files[0])}
        />

        {file && (
          <X
            className="ml-2 text-red-600 cursor-pointer"
            size={14}
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
          />
        )}
      </label>

      <Button
        onClick={handleSend}
        disabled={!input.trim() && !file}
        className="px-6"
      >
        Send
      </Button>
    </div>
  </div>
);


};

export default Room;
