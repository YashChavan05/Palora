import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  BookOpen,
  Phone,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",        to: "/dashboard" },
  { icon: Users,           label: "My Companions",    to: "/companions" },
  { icon: PlusCircle,      label: "Create Companion", to: "/create-companion" },
  { icon: BookOpen,        label: "Memories",         to: "/memories" },
  { icon: Phone,           label: "Voice Calls",      to: "/voice-call" },
  { icon: Settings,        label: "Settings",         to: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const navigate  = useNavigate();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="sidebar-3d relative h-screen flex flex-col shrink-0 z-40 overflow-hidden"
    >
      {/* Ambient depth orb */}
      <div
        className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(263 70% 57% / .12) 0%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/30">
        <motion.div
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.94 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, hsl(263 70% 57%), hsl(217 91% 60%))",
            boxShadow: "0 4px 14px hsl(263 70% 57% / .5), inset 0 1px 0 hsl(0 0% 100% / .25)",
          }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-display font-bold text-xl text-gradient whitespace-nowrap overflow-hidden"
            >
              Palora
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon   = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${active ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <motion.span
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="shrink-0"
              >
                <Icon className="w-4 h-4" />
              </motion.span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-border/30 p-3">
        <button
          onClick={() => navigate("/")}
          className={`nav-link w-full ${collapsed ? "justify-center px-2" : ""}`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-16 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted)))",
          border: "1px solid hsl(var(--border) / .7)",
          boxShadow: "0 2px 8px hsl(0 0% 0% / .4), inset 0 1px 0 hsl(0 0% 100% / .08)",
        }}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
          : <ChevronLeft  className="w-3 h-3 text-muted-foreground" />}
      </motion.button>
    </motion.aside>
  );
}
