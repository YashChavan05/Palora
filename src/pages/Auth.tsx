import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { login, signup } from "@/services/api";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<"login" | "signup">(
    searchParams.get("tab") === "signup" ? "signup" : "login"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setTab(searchParams.get("tab") === "signup" ? "signup" : "login");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (tab === "signup") {
        if (password !== confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        await signup({ name, email, password });
        toast({ title: "Success", description: "Account created successfully. Please log in." });
        setTab("login");
      } else {
        await login({ email, password });
        toast({ title: "Success", description: "Logged in successfully" });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb animate-float" style={{ width: 500, height: 500, top: "-20%", left: "-15%", background: "hsl(263 70% 57% / 0.12)" }} />
        <div className="orb animate-float" style={{ width: 400, height: 400, bottom: "-10%", right: "-10%", background: "hsl(217 91% 60% / 0.08)", animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to home */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Palora
        </motion.button>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-purple-blue flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-gradient">Palora</span>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-strong gradient-border rounded-3xl p-8 shadow-glow"
        >
          {/* Tabs */}
          <div className="flex gap-1 glass rounded-xl p-1 mb-8">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 capitalize ${
                  tab === t
                    ? "bg-gradient-purple-blue text-white shadow-glow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              initial={{ opacity: 0, x: tab === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === "login" ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h1 className="font-display font-bold text-2xl text-foreground mb-1">
                  {tab === "login" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {tab === "login"
                    ? "Sign in to reconnect with your companions."
                    : "Start your journey with Palora today."}
                </p>
              </div>

              {tab === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none focus:ring-2 focus:ring-palora-purple/20 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none focus:ring-2 focus:ring-palora-purple/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none focus:ring-2 focus:ring-palora-purple/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tab === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none focus:ring-2 focus:ring-palora-purple/20 transition-all"
                  />
                </div>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3.5 text-base mt-2 gap-2"
                disabled={isLoading}
              >
                {isLoading ? "Please wait..." : (tab === "login" ? "Sign In" : "Create Account")}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </motion.button>

              {tab === "login" && (
                <p className="text-center text-xs text-muted-foreground">
                  <a href="#" className="text-palora-blue hover:text-palora-purple transition-colors">Forgot your password?</a>
                </p>
              )}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs text-muted-foreground">
                  <span className="bg-card px-3">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-ghost w-full py-3 gap-2 text-sm"
              >
                <span className="text-lg">G</span>
                Google
              </button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                {tab === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setTab(tab === "login" ? "signup" : "login")}
                  className="text-palora-purple hover:text-palora-blue transition-colors font-medium"
                >
                  {tab === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
