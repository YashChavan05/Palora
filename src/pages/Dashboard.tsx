import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MessageCircle, Phone, BookOpen, TrendingUp, Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCompanions, createChat, getMe, getChats, getMemories } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companions, setCompanions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [userRes, compRes, chatsRes, memRes] = await Promise.all([
        getMe().catch(() => null),
        getCompanions().catch(() => []),
        getChats().catch(() => []),
        getMemories().catch(() => [])
      ]);
      if (userRes) setUser(userRes);
      setCompanions(compRes.companions || compRes || []);
      setChats(chatsRes.chats || chatsRes || []);
      setMemories(memRes.memories || memRes || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load dashboard", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (companionId: string) => {
    try {
      const chat = await createChat(companionId);
      navigate(`/chat?id=${chat._id || chat.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to start chat", variant: "destructive" });
    }
  };

  const dynamicStats = [
    { label: "Companions", value: companions.length.toString(), icon: "👥", change: "Total added", color: "text-palora-purple" },
    { label: "Conversations", value: chats.length.toString(), icon: "💬", change: "Total chats", color: "text-palora-blue" },
    { label: "Memories Saved", value: memories.length.toString(), icon: "📝", change: "Total memories", color: "text-palora-pink" },
    { label: "Voice Calls", value: "0", icon: "🎙️", change: "Coming soon", color: "text-palora-teal" },
  ];

  const recentActivities = [...chats, ...memories]
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 4)
    .map(item => {
      const isChat = !!item.messages;
      const comp = companions.find(c => (c._id || c.id) === item.companion_id);
      return {
        companion: comp ? comp.name : "Companion",
        action: isChat ? "Chat conversation updated" : `New memory: ${item.content || item.title || 'Saved'}`,
        time: new Date(item.updated_at || item.created_at).toLocaleDateString(),
        icon: isChat ? "💬" : "📝",
        color: isChat ? "text-palora-blue" : "text-palora-pink"
      };
    });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display font-black text-3xl text-foreground mb-1">
            Good morning, <span className="text-gradient">{user?.name || user?.email?.split('@')[0] || "User"}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm">Your companions are waiting. Here's what's new today.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dynamicStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 20 }}
              className="stat-card gradient-border rounded-2xl p-4"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`font-display font-black text-2xl ${stat.color} mb-0.5`}>{stat.value}</div>
              <p className="text-xs font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Companions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-foreground">My Companions</h2>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/create-companion")}
              className="btn-primary text-xs px-4 py-2 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Companion
            </motion.button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companions.map((companion, i) => (
              <motion.div
                key={companion.name}
                initial={{ opacity: 0, y: 24, rotateX: -6 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 180, damping: 18 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="card-3d gradient-border rounded-2xl p-5 cursor-default group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${companion.color || 'from-palora-purple to-palora-blue'} flex items-center justify-center text-lg font-bold text-white shadow-glow-sm`}
                  >
                    {companion.emoji || companion.name?.slice(0, 2).toUpperCase() || "AI"}
                  </div>
                  <span className="text-xs text-muted-foreground glass rounded-full px-2 py-1">{companion.lastChat || 'Just now'}</span>
                </div>
                <h3 className="font-display font-bold text-base text-foreground mb-0.5">{companion.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{companion.relationship}</p>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStartChat(companion._id || companion.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 glass rounded-lg py-2 text-xs font-medium text-foreground hover:border-palora-purple/40 hover:text-palora-purple transition-all border border-border/40"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/voice-call?id=${companion._id || companion.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 glass rounded-lg py-2 text-xs font-medium text-foreground hover:border-palora-blue/40 hover:text-palora-blue transition-all border border-border/40"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/memories")}
                    className="flex items-center justify-center glass rounded-lg p-2 text-xs font-medium text-foreground hover:border-palora-pink/40 hover:text-palora-pink transition-all border border-border/40"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => navigate("/anonymous-chat")}
              className="glass rounded-2xl border-2 border-dashed border-palora-purple/40 hover:bg-palora-purple/5 p-5 flex flex-col items-center justify-center gap-3 group transition-all duration-300 min-h-[160px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-palora-purple to-palora-pink flex items-center justify-center shadow-glow-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-foreground">Anonymous Emotion Chat</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Detects Feelings</p>
            </motion.button>

            {/* Add new */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => navigate("/create-companion")}
              className="glass rounded-2xl border-2 border-dashed border-border/60 hover:border-palora-purple/40 p-5 flex flex-col items-center justify-center gap-3 group transition-all duration-300 min-h-[160px]"
            >
              <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center group-hover:bg-palora-purple/10 transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-palora-purple transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Add New Companion</p>
            </motion.button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="font-display font-bold text-xl text-foreground mb-4">Recent Activity</h2>
          <div className="glass rounded-2xl overflow-hidden">
            {recentActivities.length > 0 ? recentActivities.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <span className="text-xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.companion}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-3.5 h-3.5 ${activity.color}`} />
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </motion.div>
            )) : (
              <div className="px-5 py-4 text-sm text-muted-foreground text-center">
                No recent activity yet. Start chatting or adding memories!
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
