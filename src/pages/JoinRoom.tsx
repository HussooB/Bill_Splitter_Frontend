import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "https://bill-splitter-backend-9b7b.onrender.com/api";

const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) {
      toast({ title: "Missing info", description: "Enter Room ID" });
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`${API_URL}/rooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to join room");
      }

      const data = await res.json();
      toast({ title: "Joined!", description: `Welcome to ${data.room.title}` });

      // ✅ Redirect to RoomChat page (room.tsx)
      navigate(`/rooms/${data.room.id}`);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Could not join room" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md p-8 shadow-medium space-y-4">
        <div className="text-center">
          <Users className="h-8 w-8 mx-auto text-primary" />
          <h1 className="text-2xl font-bold mt-2">Join Room</h1>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomId">Room ID</Label>
            <Input
              id="roomId"
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Room"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/rooms")}
          >
            Cancel
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default JoinRoom;
