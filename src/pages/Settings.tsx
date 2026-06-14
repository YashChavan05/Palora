import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { User, Lock, Shield, Bell, Moon, Sun, Trash2, ChevronRight, Check } from "lucide-react";
import { getMe, getSettings, updateSettings, updateProfile } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-display font-bold text-base text-foreground mb-4">{title}</h2>
      <div className="glass rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, sublabel, children }: { icon: React.ElementType; label: string; sublabel?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0">
      <div className="w-9 h-9 rounded-xl glass flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${checked ? "bg-gradient-purple-blue shadow-glow-sm" : "bg-muted"}`}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ duration: 0.25 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifs: false,
    callSounds: true,
    voiceMessages: true,
    privateMode: false,
    dataCollection: true,
  });
  const [user, setUser] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains("light"));
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      getMe().catch(() => null),
      getSettings().catch(() => ({})),
    ]).then(([userData, savedSettings]) => {
      if (userData) {
        setUser(userData);
        setNameInput(userData.name || userData.email?.split("@")[0] || "");
      }
      if (savedSettings && Object.keys(savedSettings).length > 0) {
        setSettings((s) => ({ ...s, ...savedSettings }));
      }
    });
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
    setIsDark(dark);
    localStorage.setItem("palora-theme", dark ? "dark" : "light");
  };

  const toggle = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings((s) => ({ ...s, [key]: newValue }));
    try {
      await updateSettings({ [key]: newValue });
    } catch {
      setSettings((s) => ({ ...s, [key]: !newValue }));
      toast({ title: "Error", description: "Failed to save setting", variant: "destructive" });
    }
  };

  const saveName = async () => {
    try {
      const updated = await updateProfile({ name: nameInput });
      setUser(updated);
      setEditingName(false);
      toast({ title: "Saved", description: "Profile updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display font-black text-3xl text-foreground mb-1">
            <span className="text-gradient">Settings</span>
          </h1>
          <p className="text-muted-foreground text-sm">Manage your account and preferences.</p>
        </motion.div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SettingsSection title="Profile">
            <div className="px-5 py-5 border-b border-border/30">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-purple-blue flex items-center justify-center text-3xl shadow-glow">
                  🧑
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{user?.name || user?.email?.split("@")[0] || "User"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "user@example.com"}</p>
                </div>
                <button onClick={() => setEditingName((v) => !v)} className="btn-ghost text-xs px-3 py-2">
                  {editingName ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingName && (
                <div className="mt-4 flex gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Display name"
                    className="flex-1 glass rounded-xl px-4 py-2 text-sm text-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none"
                  />
                  <button onClick={saveName} className="btn-primary text-xs px-4 py-2 gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              )}
            </div>

            {[
              { label: "Full Name", value: user?.name || user?.email?.split("@")[0] || "Update your name" },
              { label: "Email", value: user?.email || "No email provided" },
              { label: "Username", value: `@${user?.email?.split("@")[0] || "user"}` },
            ].map((field) => (
              <div key={field.label} className="flex items-center justify-between px-5 py-3.5 border-b border-border/30 last:border-0">
                <p className="text-sm text-muted-foreground">{field.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground">{field.value}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </SettingsSection>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SettingsSection title="Security">
            <SettingsRow icon={Lock} label="Change Password" sublabel="Last changed 3 months ago">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </SettingsRow>
            <SettingsRow icon={Shield} label="Two-Factor Authentication" sublabel="Add an extra layer of security">
              <button className="btn-primary text-xs px-3 py-1.5">Enable</button>
            </SettingsRow>
          </SettingsSection>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SettingsSection title="Notifications">
            <SettingsRow icon={Bell} label="Push Notifications" sublabel="Receive app notifications">
              <Toggle checked={settings.notifications} onChange={() => toggle("notifications")} />
            </SettingsRow>
            <SettingsRow icon={Bell} label="Email Notifications" sublabel="Get updates via email">
              <Toggle checked={settings.emailNotifs} onChange={() => toggle("emailNotifs")} />
            </SettingsRow>
            <SettingsRow icon={Bell} label="Call Sounds" sublabel="Play sounds during calls">
              <Toggle checked={settings.callSounds} onChange={() => toggle("callSounds")} />
            </SettingsRow>
          </SettingsSection>
        </motion.div>

        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SettingsSection title="Privacy">
            <SettingsRow icon={Shield} label="Private Mode" sublabel="Hide activity from analytics">
              <Toggle checked={settings.privateMode} onChange={() => toggle("privateMode")} />
            </SettingsRow>
            <SettingsRow icon={Shield} label="Data Improvement" sublabel="Help improve Palora AI">
              <Toggle checked={settings.dataCollection} onChange={() => toggle("dataCollection")} />
            </SettingsRow>
            <SettingsRow icon={User} label="Download My Data" sublabel="Get a copy of your Palora data">
              <button className="btn-ghost text-xs px-3 py-1.5">Request</button>
            </SettingsRow>
          </SettingsSection>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <SettingsSection title="Appearance">
            {/* Theme toggle row */}
            <div className="px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-9 h-9 rounded-xl glass flex items-center justify-center shrink-0">
                  {isDark ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isDark ? "Dark mode active" : "Light mode active"}</p>
                </div>
                {/* Dark / Light pill toggle */}
                <div className="flex items-center gap-1 glass rounded-xl p-1 border border-border/50">
                  <button
                    onClick={() => applyTheme(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      isDark
                        ? "bg-gradient-to-r from-[hsl(263,70%,52%)] to-[hsl(217,91%,52%)] text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Moon className="w-3 h-3" /> Dark
                  </button>
                  <button
                    onClick={() => applyTheme(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      !isDark
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sun className="w-3 h-3" /> Light
                  </button>
                </div>
              </div>

              {/* Light mode palette preview — only shown when light is active */}
              <AnimatePresence>
                {!isDark && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground mb-3 font-medium tracking-wide uppercase">Color Palette</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { name: "Violet", from: "#7c3aed", to: "#a855f7", label: "Primary" },
                        { name: "Cobalt", from: "#2563eb", to: "#60a5fa", label: "Accent" },
                        { name: "Rose",   from: "#e11d48", to: "#fb7185", label: "Highlight" },
                        { name: "Teal",   from: "#0d9488", to: "#2dd4bf", label: "Success" },
                        { name: "Amber",  from: "#d97706", to: "#fbbf24", label: "Warm" },
                      ].map((swatch) => (
                        <div key={swatch.name} className="flex flex-col items-center gap-1.5">
                          <div
                            className="w-full h-10 rounded-xl shadow-sm border border-white/40"
                            style={{ background: `linear-gradient(135deg, ${swatch.from}, ${swatch.to})` }}
                          />
                          <span className="text-[10px] font-semibold text-foreground">{swatch.name}</span>
                          <span className="text-[9px] text-muted-foreground">{swatch.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Gradient strip */}
                    <div
                      className="mt-3 h-2 rounded-full"
                      style={{ background: "linear-gradient(90deg, #7c3aed, #2563eb, #0d9488, #d97706, #e11d48)" }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Full spectrum · Palora Light</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SettingsSection>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-display font-bold text-base text-destructive mb-4">Danger Zone</h2>
          <div className="glass rounded-2xl overflow-hidden border border-destructive/20">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
              </div>
              <button className="text-xs font-medium text-destructive border border-destructive/30 rounded-lg px-3 py-1.5 hover:bg-destructive/10 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
