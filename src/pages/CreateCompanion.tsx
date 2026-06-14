import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChevronRight, ChevronLeft, Upload, Plus, X, Check, Music, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createCompanion, createChat } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const steps = ["Basic Info", "Speech Style", "Memory Builder", "Voice Upload"];

const personalities = ["Warm", "Funny", "Sarcastic", "Calm", "Energetic", "Thoughtful", "Adventurous", "Caring"];
const speechStyles = [
  { id: "casual",     label: "Casual",     desc: "Relaxed and informal, like texting a friend",   emoji: "😊" },
  { id: "funny",      label: "Funny",      desc: "Playful, witty, loves jokes and humor",          emoji: "😂" },
  { id: "supportive", label: "Supportive", desc: "Empathetic, nurturing, always there to listen",  emoji: "💙" },
  { id: "calm",       label: "Calm",       desc: "Steady, thoughtful, measured in responses",      emoji: "🌿" },
];

const ACCEPTED = ".mp3,.wav,.m4a,.ogg,.webm,.aac,.flac";

export default function CreateCompanion() {
  const [step, setStep]           = useState(0);
  const [form, setForm]           = useState({
    name: "", relationship: "", age: "", traits: [] as string[],
    speechStyle: "", memories: [] as { title: string; desc: string; event: string }[],
  });
  const [memoryForm, setMemoryForm] = useState({ title: "", desc: "", event: "" });
  const [voiceFile, setVoiceFile]   = useState<File | null>(null);
  const [waveform, setWaveform]     = useState<number[]>([]);
  const [dragOver, setDragOver]     = useState(false);
  const [isLoading, setIsLoading]   = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate     = useNavigate();
  const { toast }    = useToast();

  // ── Waveform generation from audio file ──────────────────────────────────
  useEffect(() => {
    if (!voiceFile) { setWaveform([]); return; }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    voiceFile.arrayBuffer().then(buf => ctx.decodeAudioData(buf)).then(decoded => {
      const raw    = decoded.getChannelData(0);
      const bars   = 60;
      const chunk  = Math.floor(raw.length / bars);
      const points = Array.from({ length: bars }, (_, i) => {
        let sum = 0;
        for (let j = 0; j < chunk; j++) sum += Math.abs(raw[i * chunk + j] || 0);
        return sum / chunk;
      });
      const max = Math.max(...points, 0.001);
      setWaveform(points.map(v => Math.round((v / max) * 100)));
    }).catch(() => {
      // fallback: random bars so UI still looks good
      setWaveform(Array.from({ length: 60 }, () => 20 + Math.random() * 80));
    }).finally(() => ctx.close());
  }, [voiceFile]);

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("audio/") && !f.name.match(/\.(mp3|wav|m4a|ogg|webm|aac|flac)$/i)) {
      toast({ title: "Invalid file", description: "Please upload an audio file (MP3, WAV, M4A…)", variant: "destructive" });
      return;
    }
    setVoiceFile(f);
    toast({ title: "File selected", description: f.name });
  };

  // ── Form helpers ──────────────────────────────────────────────────────────
  const toggleTrait = (t: string) =>
    setForm(f => ({ ...f, traits: f.traits.includes(t) ? f.traits.filter(x => x !== t) : [...f.traits, t] }));

  const addMemory = () => {
    if (!memoryForm.title) return;
    setForm(f => ({ ...f, memories: [...f.memories, memoryForm] }));
    setMemoryForm({ title: "", desc: "", event: "" });
  };

  const removeMemory = (i: number) =>
    setForm(f => ({ ...f, memories: f.memories.filter((_, idx) => idx !== i) }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Please enter a companion name", variant: "destructive" });
      setStep(0);
      return;
    }
    try {
      setIsLoading(true);
      const payload = {
        name:        form.name || "Unknown",
        description: `Relationship: ${form.relationship}. Age: ${form.age}. Style: ${form.speechStyle}`,
        personality: form.traits.join(", ") || "Friendly",
        memories:    form.memories.map(m => `${m.title}: ${m.desc}${m.event ? " (" + m.event + ")" : ""}`),
        voiceFile:   voiceFile ?? undefined,
      };

      const companionResult = await createCompanion(payload);
      const companionId     = companionResult._id || companionResult.id;

      const chatResult = await createChat(companionId);
      const chatId     = chatResult._id || chatResult.id;

      toast({ title: "Success", description: "Companion created!" });
      navigate(`/chat?id=${chatId}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create companion", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display font-black text-3xl text-foreground mb-1">
            Create a <span className="text-gradient">Companion</span>
          </h1>
          <p className="text-muted-foreground text-sm">Bring someone meaningful back to life through AI.</p>
        </motion.div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                i < step  ? "bg-gradient-purple-blue text-white shadow-glow-sm" :
                i === step ? "glass border-2 border-palora-purple text-palora-purple" :
                             "glass text-muted-foreground"
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && (
                <div className={`h-px w-6 sm:w-12 transition-colors ${i < step ? "bg-palora-purple" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="glass gradient-border rounded-2xl p-6 mb-6"
          >

            {/* ── Step 0: Basic Info ── */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-xl text-foreground">Basic Information</h2>
                {[
                  { label: "Companion Name *", key: "name",         placeholder: "e.g. Maya, Dad, Grandma Rose" },
                  { label: "Relationship",      key: "relationship", placeholder: "e.g. Best friend, Mother, Partner" },
                  { label: "Age (optional)",    key: "age",          placeholder: "e.g. 28" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
                    <input
                      value={form[field.key as keyof typeof form] as string}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-palora-purple/50 focus:outline-none focus:ring-2 focus:ring-palora-purple/20 transition-all"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Personality Traits</label>
                  <div className="flex flex-wrap gap-2">
                    {personalities.map(trait => (
                      <button key={trait} onClick={() => toggleTrait(trait)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.traits.includes(trait)
                            ? "bg-gradient-purple-blue text-white shadow-glow-sm"
                            : "glass border border-border/50 text-muted-foreground hover:text-foreground hover:border-palora-purple/40"
                        }`}>
                        {trait}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Speech Style ── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-xl text-foreground">Speech Style</h2>
                <p className="text-sm text-muted-foreground">How did they typically communicate?</p>
                <div className="grid grid-cols-2 gap-3">
                  {speechStyles.map(style => (
                    <button key={style.id} onClick={() => setForm(f => ({ ...f, speechStyle: style.id }))}
                      className={`glass rounded-xl p-4 text-left border transition-all duration-200 ${
                        form.speechStyle === style.id
                          ? "border-palora-purple/60 bg-palora-purple/10 shadow-glow-sm"
                          : "border-border/40 hover:border-palora-purple/30"
                      }`}>
                      <div className="text-2xl mb-2">{style.emoji}</div>
                      <p className="font-semibold text-sm text-foreground mb-1">{style.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2: Memory Builder ── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-xl text-foreground">Memory Builder</h2>
                <p className="text-sm text-muted-foreground">Add memories that shaped your relationship.</p>
                <div className="glass rounded-xl p-4 space-y-3 border border-border/40">
                  <input value={memoryForm.title} onChange={e => setMemoryForm(m => ({ ...m, title: e.target.value }))}
                    placeholder="Memory title (e.g. Summer road trip 2019)"
                    className="w-full bg-transparent border-b border-border/40 pb-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-palora-purple/50" />
                  <textarea value={memoryForm.desc} onChange={e => setMemoryForm(m => ({ ...m, desc: e.target.value }))}
                    placeholder="Describe what happened..." rows={2}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" />
                  <input value={memoryForm.event} onChange={e => setMemoryForm(m => ({ ...m, event: e.target.value }))}
                    placeholder="Event / date (optional)"
                    className="w-full bg-transparent border-b border-border/40 pb-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-palora-purple/50" />
                  <button onClick={addMemory} className="btn-primary text-xs px-4 py-2 gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Memory
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  {form.memories.map((mem, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-lg px-4 py-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{mem.title}</p>
                        {mem.desc && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mem.desc}</p>}
                      </div>
                      <button onClick={() => removeMemory(i)} className="text-muted-foreground hover:text-destructive transition-colors mt-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                  {form.memories.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No memories added yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 3: Voice Upload ── */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-xl text-foreground">Voice Upload</h2>
                <p className="text-sm text-muted-foreground">
                  Upload an audio sample to clone their voice. <span className="text-palora-teal">Optional</span> — you can skip this step.
                </p>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  className="hidden"
                  onChange={e => handleFiles(e.target.files)}
                />

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => !voiceFile && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                    dragOver
                      ? "border-palora-purple/70 bg-palora-purple/8 scale-[1.01]"
                      : voiceFile
                      ? "border-palora-teal/50 bg-palora-teal/5"
                      : "border-border/50 hover:border-palora-purple/40 hover:bg-palora-purple/3"
                  }`}
                >
                  {voiceFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-palora-teal/20 flex items-center justify-center">
                        <Music className="w-5 h-5 text-palora-teal" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{voiceFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(voiceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setVoiceFile(null); }}
                        className="ml-2 p-1.5 glass rounded-lg hover:border-destructive/40 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-7 h-7 text-palora-purple" />
                      </div>
                      <p className="font-semibold text-sm text-foreground mb-1">Drop voice file here or click to browse</p>
                      <p className="text-xs text-muted-foreground">MP3, WAV, M4A, OGG · up to 30 min</p>
                    </>
                  )}
                </div>

                {/* Browse button (separate, always visible) */}
                {!voiceFile && (
                  <button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-xs px-4 py-2 w-full">
                    Browse Files
                  </button>
                )}

                {/* Waveform preview */}
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    {voiceFile ? "Waveform Preview" : "Voice Sample Preview"}
                  </p>
                  <div className="flex items-end justify-center gap-0.5 h-12">
                    {waveform.length > 0
                      ? waveform.map((h, i) => (
                          <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: i * 0.01 }}
                            className="flex-1 rounded-full bg-gradient-to-t from-palora-purple to-palora-blue"
                            style={{ height: `${h}%`, minHeight: 3 }}
                          />
                        ))
                      : Array.from({ length: 60 }).map((_, i) => (
                          <div key={i} className="flex-1 rounded-full bg-palora-purple/15"
                            style={{ height: `${15 + Math.sin(i * 0.5) * 10}%` }} />
                        ))
                    }
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {voiceFile ? `${voiceFile.name} — ready to upload` : "Upload a file to preview waveform"}
                  </p>
                </div>

                <div className="glass rounded-xl p-4 border border-palora-blue/20">
                  <p className="text-xs font-medium text-palora-blue mb-1">💡 Tips for best results</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Use clear recordings with minimal background noise</li>
                    <li>• 5–30 minutes of audio gives the best voice clone</li>
                    <li>• Phone calls, videos, or voice memos all work well</li>
                  </ul>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : navigate("/dashboard")}
            className="btn-ghost text-sm px-5 py-2.5 gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>

          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-palora-purple" : i < step ? "w-1.5 bg-palora-purple/60" : "w-1.5 bg-border"
              }`} />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => step < steps.length - 1 ? setStep(step + 1) : handleCreate()}
            disabled={isLoading}
            className="btn-primary text-sm px-5 py-2.5 gap-2 disabled:opacity-60"
          >
            {isLoading
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
              : step === steps.length - 1
              ? "Create Companion ✨"
              : <>Continue <ChevronRight className="w-4 h-4" /></>
            }
          </motion.button>
        </div>

      </div>
    </DashboardLayout>
  );
}
