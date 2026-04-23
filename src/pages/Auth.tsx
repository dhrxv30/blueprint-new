import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "lucide-react";
import { supabase } from "@/lib/supabase"; // <-- ADDED SUPABASE IMPORT

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 text-white">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none" className="text-primary">
              <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.9" />
              <rect x="16" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
              <rect x="2" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
              <rect x="16" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.3" />
            </svg>
            <span className="text-2xl font-bold tracking-tight">Blueprint.dev</span>
          </div>
        </div>

        {errorMsg && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-sm text-center">{errorMsg}</div>}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 text-zinc-400">
            <TabsTrigger value="login" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription className="text-zinc-400">Enter your credentials to access your workspace.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-zinc-950 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-zinc-950 border-zinc-800" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary hover:brightness-110" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription className="text-zinc-400">Start transforming your PRDs into architecture.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-zinc-950 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-zinc-950 border-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-zinc-950 border-zinc-800" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary hover:brightness-110" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}