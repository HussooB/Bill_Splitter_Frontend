import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Receipt, Users, CheckCircle, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SplitEasy
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Log In
          </Button>
          <Button onClick={() => navigate("/signup")}>
            Get Started
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Split Bills Effortlessly
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            No more awkward money conversations. Create a room, assign items, and track payments seamlessly.
          </p>
          <Button size="lg" className="shadow-medium" onClick={() => navigate("/signup")}>
            Start Splitting Now →
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-6 shadow-soft hover:shadow-medium transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Rooms</h3>
            <p className="text-muted-foreground">
              Set up a room for any shared expense - dinners, trips, or events.
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft hover:shadow-medium transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Invite Friends</h3>
            <p className="text-muted-foreground">
              Share a simple link and let everyone join instantly.
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft hover:shadow-medium transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Payments</h3>
            <p className="text-muted-foreground">
              Everyone sees their share and can upload payment proof.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
