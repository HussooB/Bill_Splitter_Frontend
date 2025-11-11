import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const RoomHeader = () => {
  // Mock data - will be replaced with API calls
  const room = {
    title: "Dinner at Italian Restaurant",
    creator: "John Doe",
    status: "ACTIVE",
    participants: 5,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{room.title}</h1>
        <Badge variant={room.status === "ACTIVE" ? "default" : "secondary"}>
          {room.status}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Created by {room.creator}</span>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{room.participants} participants</span>
        </div>
      </div>
    </div>
  );
};

export default RoomHeader;
