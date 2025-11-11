import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "https://bill-splitter-backend-9b7b.onrender.com/api";

interface LoginResponse {
  user: {
    id: number;
    email: string;
    name: string;
    createdAt: string;
  };
  token: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Invalid credentials");
      }

      const data: LoginResponse = await res.json();

      // ✅ Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.name);

      toast({
        title: "Login successful!",
        description: `Welcome back, ${data.user.name}!`,
      });

      navigate("/rooms");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your email and password.",
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
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground">
            Log in to continue to SplitEasy
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Enter your password"
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
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
