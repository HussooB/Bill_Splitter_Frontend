import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, X, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "https://bill-splitter-backend-9b7b.onrender.com/api";

interface MenuItem {
  id: string;
  name: string;
  price: string;
}

interface CreateRoomResponse {
  room: {
    id: number;
    title: string;
    menu: string[];
    createdAt: string;
    updatedAt: string;
  };
  roomLink: string;
}

const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: "1", name: "", price: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<CreateRoomResponse | null>(null);

  const addMenuItem = () => {
    setMenuItems([...menuItems, { id: Date.now().toString(), name: "", price: "" }]);
  };

  const removeMenuItem = (id: string) => {
    if (menuItems.length > 1) {
      setMenuItems(menuItems.filter((item) => item.id !== id));
    }
  };

  const updateMenuItem = (id: string, field: "name" | "price", value: string) => {
    setMenuItems(
      menuItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({ title: "Error", description: "Room title is required." });
      return;
    }

    const validMenu = menuItems
      .filter((item) => item.name.trim().length > 0)
      .map((item) => ({
        name: item.name.trim(),
        price: parseFloat(item.price),
      }));

    if (validMenu.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one menu item.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ title, menu: validMenu }),
      });

      const text = await response.text();
      console.log("Raw response:", text);

      if (!response.ok) throw new Error(text || "Failed to create room");

      const data: CreateRoomResponse = JSON.parse(text);
      setCreatedRoom(data);

      toast({
        title: "Room created!",
        description: "Your room has been created successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong while creating the room.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.room.id.toString());
      toast({ title: "Copied", description: "Room ID copied to clipboard." });
    }
  };

  const handleJoin = () => {
    if (createdRoom) navigate(createdRoom.roomLink);
  };

  return (
    <div
      className={`min-h-screen relative bg-gradient-to-br from-primary/5 via-background to-accent/5 transition-all duration-300 ${
        createdRoom ? "backdrop-blur-sm" : ""
      }`}
    >
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/rooms")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Create New Room
            </h1>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Room Title</Label>
              <Input
                id="title"
                placeholder="e.g., Dinner at Italian Restaurant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Menu Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMenuItem}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) =>
                        updateMenuItem(item.id, "name", e.target.value)
                      }
                      required
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) =>
                        updateMenuItem(item.id, "price", e.target.value)
                      }
                      className="w-32"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMenuItem(item.id)}
                      disabled={menuItems.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/rooms")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Room"}
              </Button>
            </div>
          </form>
        </Card>
      </main>

      {/* ✅ Modal for Created Room */}
      {createdRoom && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-md"></div>
          <Card className="relative z-10 w-full max-w-sm p-6 text-center space-y-4 shadow-xl border-border">
            <h2 className="text-xl font-bold text-foreground">
              Room Created 🎉
            </h2>
            <p className="text-muted-foreground text-sm">
              Share this Room ID with others to let them join:
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-muted px-3 py-1 rounded text-lg font-semibold">
                {createdRoom.room.id}
              </code>
              <Button size="icon" variant="ghost" onClick={handleCopy}>
                <Copy className="h-5 w-5" />
              </Button>
            </div>

            <Button className="w-full mt-4" onClick={handleJoin}>
              Join Room
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreateRoom;
