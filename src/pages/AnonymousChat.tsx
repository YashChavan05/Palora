import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Send, ArrowLeft, Brain, Smile, Mic, ImageIcon, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sendAnonymousMessage } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  emotion?: string;
}

export default function AnonymousChat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsTyping(true);

    try {
      const res = await sendAnonymousMessage(currentInput);
      
      const aiMessage: Message = {
        role: "assistant",
        content: res.response,
        emotion: res.emotion,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 glass rounded-2xl px-6 py-4 border border-border/40">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted/40 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                Anonymous Emotion Chat <Sparkles className="w-4 h-4 text-palora-purple" />
              </h2>
              <p className="text-xs text-muted-foreground">Your identity is private. We use AI to understand your feelings.</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4 px-2 scrollbar-thin">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-purple-blue flex items-center justify-center shadow-glow mb-4">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground">How are you feeling?</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Start a conversation anonymously. Our ML model will detect your emotions and provide supportive responses.
                </p>
              </motion.div>
            )}
            
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-palora-purple to-palora-pink flex items-center justify-center text-white shrink-0 shadow-glow-sm">
                    <Brain className="w-4 h-4" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div
                    className={`max-w-xs md:max-w-md px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "chat-bubble-user text-white"
                        : "chat-bubble-ai text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.emotion && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold ml-1 bg-muted/40 px-2 py-0.5 rounded-full inline-block self-start"
                    >
                      Emotion detected: <span className="text-palora-purple">{msg.emotion}</span>
                    </motion.span>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-purple-blue flex items-center justify-center text-white shrink-0 shadow-glow-sm">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="chat-bubble-ai px-4 py-3 flex items-center gap-1.5">
                  <span className="typing-dot w-2 h-2 rounded-full bg-palora-purple" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-palora-blue" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-palora-pink" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Input area */}
        <div className="px-2 py-4 border-t border-border/40">
          <div className="flex items-end gap-3">
            <div className="flex-1 glass rounded-2xl px-4 py-3 flex items-center gap-3">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type your message anonymously..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              className="w-11 h-11 bg-gradient-purple-blue rounded-xl flex items-center justify-center shadow-glow-sm shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}