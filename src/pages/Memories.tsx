import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, Search, Calendar, Edit2, Trash2, X, Check } from "lucide-react";
import { useEffect } from "react";
import { getCompanions, getMemories, createMemory, updateMemory, deleteMemory } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Memory { id: string; title: string; desc: string; event: string; companion: string; tag: string; companion_id: string; }

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [companions, setCompanions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", desc: "", event: "", companion_id: "", tag: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [compsRes, memsRes] = await Promise.all([
        getCompanions().catch(() => ({})),
        getMemories().catch(() => ({}))
      ]);
      const comps = compsRes.companions || compsRes || [];
      const mems = memsRes.memories || memsRes || [];
      
      const parsedMemories = mems.map((m: any) => {
        let parsed = { title: "Memory", desc: m.content || "", event: new Date(m.created_at).toLocaleDateString(), tag: "Personal" };
        try {
          const contentData = JSON.parse(m.content);
          if (contentData.title) parsed = { ...parsed, ...contentData };
        } catch (e) {
          // not json
        }
        
        const comp = comps.find((c: any) => (c._id || c.id) === m.companion_id);
        return { ...parsed, id: m._id || m.id, companion_id: m.companion_id, companion: comp ? comp.name : "Unknown Companion" };
      });
      setMemories(parsedMemories);
      setCompanions(comps);
    } catch(e) {
      toast({ title: "Error", description: "Failed to load memories", variant: "destructive" });
    }
  };

  const filtered = memories.filter(
    (m) => m.title.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase()) || m.companion.toLowerCase().includes(search.toLowerCase())
  );

  const startAdd = () => { setForm({ title: "", desc: "", event: "", companion_id: companions[0]?._id || companions[0]?.id || "", tag: "" }); setAdding(true); };
  
  const startEdit = (m: Memory) => { setForm({ title: m.title, desc: m.desc, event: m.event, companion_id: m.companion_id, tag: m.tag }); setEditing(m.id); };
  
  const saveNew = async () => { 
    if (!form.title || !form.companion_id) return; 
    setAdding(false);
    try {
      await createMemory({
        companion_id: form.companion_id,
        content: JSON.stringify({ title: form.title, desc: form.desc, event: form.event, tag: form.tag })
      });
      fetchAllData();
      toast({ title: "Success", description: "Memory added successfully" });
    } catch(e) {
      toast({ title: "Error", description: "Failed to add memory", variant: "destructive" });
    }
  };
  
  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateMemory(
        editing,
        JSON.stringify({ title: form.title, desc: form.desc, event: form.event, tag: form.tag })
      );
      setMemories((ms) =>
        ms.map((m) =>
          m.id === editing
            ? { ...m, ...form, companion: companions.find((c) => (c._id || c.id) === form.companion_id)?.name || "Unknown" }
            : m
        )
      );
      setEditing(null);
      toast({ title: "Success", description: "Memory updated" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update memory", variant: "destructive" });
    }
  };
  
  const remove = async (id: string) => {
    try {
      await deleteMemory(id);
      setMemories((ms) => ms.filter((m) => m.id !== id));
      toast({ title: "Deleted", description: "Memory removed" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete memory", variant: "destructive" });
    }
  };

  const tagColors: Record<string, string> = {
    Adventure: "text-palora-purple border-palora-purple/30",
    Family: "text-palora-pink border-palora-pink/30",
    School: "text-palora-blue border-palora-blue/30",
    Personal: "text-palora-teal border-palora-teal/30",
    Wisdom: "text-palora-purple border-palora-purple/30",
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-black text-3xl text-foreground mb-1">
              <span className="text-gradient">Memories</span>
            </h1>
            <p className="text-muted-foreground text-sm">The stories that make your companions come alive.</p>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={startAdd} className="btn-primary text-sm px-5 py-2.5 gap-2">
            <Plus className="w-4 h-4" /> Add Memory
          </motion.button>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full glass rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none transition-all max-w-md"
          />
        </div>

        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              className="glass gradient-border rounded-2xl p-5 mb-6 space-y-3"
            >
              <h3 className="font-display font-bold text-base text-foreground">New Memory</h3>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none transition-all" />
              <textarea value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} placeholder="Description..." rows={2} className="w-full glass rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none resize-none transition-all" />
              <div className="flex gap-2 flex-wrap">
                <input value={form.event} onChange={(e) => setForm((f) => ({ ...f, event: e.target.value }))} placeholder="Date / Event" className="flex-1 min-w-[120px] glass rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none" />
                <select value={form.companion_id} onChange={(e) => setForm((f) => ({ ...f, companion_id: e.target.value }))} className="flex-1 min-w-[120px] glass rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none bg-background">
                  <option value="" disabled>Select Companion</option>
                  {companions.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                </select>
                <input value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} placeholder="Tag" className="flex-1 min-w-[100px] glass rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveNew} className="btn-primary text-xs px-4 py-2 gap-1.5"><Check className="w-3.5 h-3.5" />Save</button>
                <button onClick={() => setAdding(false)} className="btn-ghost text-xs px-4 py-2 gap-1.5"><X className="w-3.5 h-3.5" />Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        <div className="space-y-4">
          {filtered.map((memory, i) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              layout
              className="flex gap-4"
            >
              {/* Timeline line */}
              <div className="flex flex-col items-center shrink-0 mt-1">
                <div className="w-3 h-3 rounded-full bg-gradient-purple-blue shadow-glow-sm shrink-0" />
                {i < filtered.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-palora-purple/30 to-transparent mt-1 min-h-[40px]" />}
              </div>

              {/* Card */}
              <motion.div whileHover={{ x: 4, transition: { duration: 0.2 } }} className="flex-1 glass gradient-border rounded-2xl p-5 group">
                <AnimatePresence mode="wait">
                  {editing === memory.id ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full glass rounded-lg px-3 py-2 text-sm text-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none" />
                      <textarea value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} rows={2} className="w-full glass rounded-lg px-3 py-2 text-sm text-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none resize-none" />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="btn-primary text-xs px-3 py-1.5 gap-1"><Check className="w-3 h-3" />Save</button>
                        <button onClick={() => setEditing(null)} className="btn-ghost text-xs px-3 py-1.5 gap-1"><X className="w-3 h-3" />Cancel</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-display font-bold text-base text-foreground">{memory.title}</h3>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(memory)} className="p-1.5 glass rounded-lg hover:border-palora-blue/40 transition-all">
                            <Edit2 className="w-3.5 h-3.5 text-palora-blue" />
                          </button>
                          <button onClick={() => remove(memory.id)} className="p-1.5 glass rounded-lg hover:border-destructive/40 transition-all">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{memory.desc}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {memory.event}
                        </div>
                        {memory.companion && <span className="text-xs text-palora-purple glass rounded-full px-2 py-0.5 border border-palora-purple/20">{memory.companion}</span>}
                        {memory.tag && <span className={`text-xs glass rounded-full px-2 py-0.5 border ${tagColors[memory.tag] || "text-muted-foreground border-border/40"}`}>{memory.tag}</span>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-muted-foreground text-sm">No memories found.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
