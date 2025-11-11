import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Users, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Rooms: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast({ title: "Logged out", description: "You have been logged out." });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Navbar */}
      <header className="w-full bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Bill Splitter</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Centered buttons */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6">
        <Button
          className="gap-3 text-lg font-semibold w-64 py-6 bg-primary/80 hover:bg-primary/90 text-white"
          size="lg"
          onClick={() => navigate("/rooms/new")}
        >
          <Plus className="h-6 w-6" />
          Create Room
        </Button>
        <Button
          className="gap-3 text-lg font-semibold w-64 py-6 border border-primary/70 hover:bg-primary/10 text-primary"
          size="lg"
          variant="outline"
          onClick={() => navigate("/rooms/join")}
        >
          <Users className="h-6 w-6" />
          Join Room
        </Button>
      </main>
    </div>
  );
};

export default Rooms;
