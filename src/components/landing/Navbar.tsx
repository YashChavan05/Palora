import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "glass-strong py-3" : "py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-purple-blue flex items-center justify-center shadow-glow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gradient">Palora</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Demo", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate("/auth")} className="btn-ghost text-sm px-4 py-2">
              Sign In
            </button>
            <button onClick={() => navigate("/auth?tab=signup")} className="btn-primary text-sm px-4 py-2">
              Get Started
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[60px] z-40 glass-strong border-b border-border/50 p-6 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {["Features", "How It Works", "Demo"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="text-foreground font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <button onClick={() => { navigate("/auth"); setMobileOpen(false); }} className="btn-ghost w-full">
                  Sign In
                </button>
                <button onClick={() => { navigate("/auth?tab=signup"); setMobileOpen(false); }} className="btn-primary w-full">
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
