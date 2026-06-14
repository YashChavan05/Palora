import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-purple-blue flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-gradient">Palora</span>
          </Link>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {["Privacy", "Terms", "Security", "Contact"].map((item) => (
              <a key={item} href="#" className="hover:text-foreground transition-colors">
                {item}
              </a>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            © 2025 Palora. Reconnecting what matters.
          </p>
        </div>
      </div>
    </footer>
  );
}
