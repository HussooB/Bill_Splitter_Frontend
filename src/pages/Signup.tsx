import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "https://bill-splitter-backend-9b7b.onrender.com/api";

interface SignupResponse {
  user: {
    id: number;
    email: string;
    name: string;
    createdAt: string;
  };
  token: string;
}

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to sign up");
      }

      const data: SignupResponse = await res.json();

      // ✅ Store token and user ID in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());

      toast({
        title: "Account created!",
        description: `Welcome, ${data.user.name}!`,
      });

      navigate("/rooms");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Signup failed",
        description:
          error.message || "Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md p-8 shadow-medium">
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
              <Receipt className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground">
            Join SplitEasy to start splitting bills
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Signup;
