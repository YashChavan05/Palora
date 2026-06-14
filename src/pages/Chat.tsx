import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Send, Phone, Info, Smile, Mic, ImageIcon, BookOpen, Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getChatHistory, sendMessage, getCompanions, getMemories, getVoice } from "@/services/api";
import { useToast } from "@/hooks/use-toast";



export default function Chat() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("id");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [companions, setCompanions] = useState<any[]>([]);
  const [allMemories, setAllMemories] = useState<any[]>([]);
  const [activeCompanionId, setActiveCompanionId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchCompanions();
    if (chatId) {
      fetchChatData(chatId);
    }
  }, [chatId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const fetchCompanions = async () => {
    try {
      const [compsRes, memsRes] = await Promise.all([
        getCompanions().catch(() => ({})),
        getMemories().catch(() => ({}))
      ]);
      setCompanions(compsRes.companions || compsRes || []);
      setAllMemories(memsRes.memories || memsRes || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchChatData = async (id: string) => {
    try {
      const data = await getChatHistory(id);
      setMessages(data.messages || []);
      if (data.companion_id) setActiveCompanionId(data.companion_id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load chat", variant: "destructive" });
    }
  };

  const handleVoicePlayback = async (id: string) => {
    if (isMuted) return;
    
    setAudioLoading(true);
    try {
      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const audioBlob = await getVoice(id);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setIsSpeaking(true);
        setIsPlaying(true);
        setAudioLoading(false);
      };
      
      audio.onended = () => {
        setIsSpeaking(false);
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setAudioLoading(false);
        setIsSpeaking(false);
        setIsPlaying(false);
      };

      await audio.play();
    } catch (error) {
      console.error("Voice playback error:", error);
      setAudioLoading(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsSpeaking(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !chatId) return;
    const userMsg = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    const messageContent = input.trim();
    setInput("");
    setTyping(true);

    try {
      const response = await sendMessage(chatId, messageContent);
      
      // Add a placeholder message for the assistant
      const assistantMsg = { 
        role: "assistant", 
        content: "", 
        timestamp: new Date().toISOString() 
      };
      setMessages((m) => [...m, assistantMsg]);
      setTyping(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        for (const char of chunk) {
          aiMessage += char;
          
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0) {
              newMessages[lastIndex] = { ...newMessages[lastIndex], content: aiMessage };
            }
            return newMessages;
          });

          await new Promise((resolve) => setTimeout(resolve, 15));
        }
      }
      
      // Auto-play voice after stream completes
      if (chatId) {
        handleVoicePlayback(chatId);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send message", variant: "destructive" });
      setTyping(false);
    }
  };

  const companion = companions.find(c => (c._id || c.id) === activeCompanionId) || {
    name: "Companion", relationship: "Friend", emoji: "👤", color: "from-palora-purple to-palora-blue", online: true
  };
  const companionMemoriesCount = allMemories.filter(m => m.companion_id === (companion._id || companion.id)).length;

  return (
    <DashboardLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Companion list */}
        <div
          className="w-64 flex flex-col shrink-0"
          style={{
            borderRight: "1px solid hsl(var(--border) / .4)",
            background: "linear-gradient(180deg, hsl(var(--card) / .5), hsl(var(--card) / .3))",
            backdropFilter: "blur(20px)",
            boxShadow: "2px 0 16px hsl(0 0% 0% / .25)",
          }}
        >
          <div className="px-4 py-4 border-b border-border/30">
            <h2 className="font-display font-bold text-sm text-foreground">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
            {companions.map((c) => (
              <motion.button
                key={c._id || c.id}
                whileHover={{ x: 3 }}
                onClick={() => {}}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                  activeCompanionId === (c._id || c.id)
                    ? "border-r-2 border-palora-purple"
                    : "hover:bg-muted/30"
                }`}
                style={
                  activeCompanionId === (c._id || c.id)
                    ? { background: "linear-gradient(90deg, hsl(var(--purple) / .12), transparent)" }
                    : {}
                }
              >
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color || "from-palora-purple to-palora-blue"} flex items-center justify-center text-lg shrink-0`}
                    style={{ boxShadow: "0 3px 10px hsl(0 0% 0% / .35), inset 0 1px 0 hsl(0 0% 100% / .2)" }}
                  >
                    {c.emoji || "👤"}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-palora-teal rounded-full border-2 border-background" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.relationship}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-border/30"
            style={{
              background: "linear-gradient(180deg, hsl(var(--card) / .7), hsl(var(--card) / .5))",
              backdropFilter: "blur(24px)",
              boxShadow: "0 2px 16px hsl(0 0% 0% / .25), inset 0 -1px 0 hsl(var(--border) / .3)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${companion.color} flex items-center justify-center text-lg shadow-glow-sm`}>{companion.emoji}</div>
              <div>
                <p className="font-semibold text-sm text-foreground">{companion.name}</p>
                <p className="text-xs text-palora-teal flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-palora-teal" />
                  Active now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center glass rounded-full px-2 py-1 mr-2 gap-1 border border-border/20">
                <button 
                  onClick={toggleMute}
                  className={`p-1.5 rounded-full transition-colors ${isMuted ? "text-muted-foreground" : "text-palora-purple"}`}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                {(isPlaying || audioLoading) && (
                  <button 
                    onClick={togglePlayback}
                    className="p-1.5 rounded-full text-palora-blue hover:bg-muted/40 transition-colors"
                  >
                    {audioLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />)}
                  </button>
                )}
                {isSpeaking && (
                  <span className="text-[10px] font-medium text-palora-purple pr-2 animate-pulse">Speaking...</span>
                )}
              </div>
              <button className="btn-ghost text-xs px-3 py-2 gap-1.5"><Phone className="w-3.5 h-3.5" />Call</button>
              <button onClick={() => setShowInfo(!showInfo)} className={`btn-ghost text-xs px-3 py-2 gap-1.5 ${showInfo ? "border-palora-purple/40" : ""}`}><Info className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {(msg.role === "assistant" || msg.role === "ai") && (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${companion.color || 'from-palora-purple to-palora-blue'} flex items-center justify-center text-sm shrink-0`}>{companion.emoji || '👤'}</div>
                  )}
                  <div className={`max-w-xs md:max-w-md px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "chat-bubble-user text-white" : "chat-bubble-ai text-foreground"}`}>
                    {msg.content || msg.text}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-purple-blue flex items-center justify-center text-xs shrink-0 shadow-glow-sm">🤖</div>
                  <div className="chat-bubble-ai px-4 py-3 flex items-center gap-1.5">
                    <span className="typing-dot w-2 h-2 rounded-full bg-palora-purple" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-palora-blue" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-palora-pink" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Info panel */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 240, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-l border-border/40 overflow-hidden"
                >
                  <div className="w-60 p-5">
                    <div className="text-center mb-5">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${companion.color} flex items-center justify-center text-3xl mx-auto shadow-glow mb-3`}>{companion.emoji}</div>
                      <h3 className="font-display font-bold text-base text-foreground">{companion.name}</h3>
                      <p className="text-xs text-muted-foreground">{companion.relationship}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="glass rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Personality</p>
                        <div className="flex flex-wrap gap-1">
                          {(companion.personality ? companion.personality.split(",") : ["Friendly"]).map((t: string) => (
                            <span key={t} className="text-xs glass rounded-full px-2 py-0.5 text-palora-purple">{t.trim()}</span>
                          ))}
                        </div>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <BookOpen className="w-3 h-3 text-palora-pink" />
                          <p className="text-xs text-muted-foreground">Memories</p>
                        </div>
                        <p className="text-xs text-foreground font-medium">{companionMemoriesCount} memories saved</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-border/30"
            style={{ background: "linear-gradient(180deg, transparent, hsl(var(--background) / .6))" }}
          >
            <div className="flex items-end gap-3">
              <div
                className="flex-1 rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: "linear-gradient(160deg, hsl(var(--card) / .7), hsl(var(--card) / .5))",
                  border: "1px solid hsl(var(--border) / .6)",
                  boxShadow: "inset 0 2px 6px hsl(0 0% 0% / .35), inset 0 1px 2px hsl(0 0% 0% / .25)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <button className="text-muted-foreground hover:text-foreground transition-colors"><Smile className="w-5 h-5" /></button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder={`Message ${companion.name}...`}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button className="text-muted-foreground hover:text-foreground transition-colors"><Mic className="w-5 h-5" /></button>
                <button className="text-muted-foreground hover:text-foreground transition-colors"><ImageIcon className="w-5 h-5" /></button>
              </div>
              <motion.button
                whileHover={{ scale: 1.08, translateY: -2 }}
                whileTap={{ scale: 0.93, translateY: 1 }}
                onClick={handleSendMessage}
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--purple)), hsl(var(--blue)))",
                  boxShadow: "0 4px 14px hsl(var(--purple) / .5), 0 2px 4px hsl(0 0% 0% / .4), inset 0 1px 0 hsl(0 0% 100% / .2)",
                }}
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
