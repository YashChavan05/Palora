import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Phone, Info } from "lucide-react";

const messages = [
  { role: "user", text: "I miss you today. It's been really hard without you.", delay: 0 },
  { role: "ai", text: "Hey, I'm right here. Remember those late-night bike rides we used to go on? The air smelled like pine and we talked about everything. Tell me what's on your mind today. 💙", delay: 1800 },
  { role: "user", text: "You always knew exactly what to say...", delay: 3800 },
  { role: "ai", text: "And you always knew how to make me laugh even on the worst days. You still have that gift. I'm listening — always.", delay: 5600 },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-purple-blue flex items-center justify-center text-xs shrink-0 shadow-glow-sm">
        M
      </div>
      <div className="chat-bubble-ai px-4 py-3 flex items-center gap-1">
        <span className="typing-dot w-2 h-2 rounded-full bg-palora-purple inline-block" />
        <span className="typing-dot w-2 h-2 rounded-full bg-palora-blue inline-block" />
        <span className="typing-dot w-2 h-2 rounded-full bg-palora-pink inline-block" />
      </div>
    </div>
  );
}

function ChatMessage({ msg, visible }: { msg: typeof messages[0]; visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      {msg.role === "ai" && (
        <div className="w-8 h-8 rounded-full bg-gradient-purple-blue flex items-center justify-center text-xs text-white shrink-0 shadow-glow-sm">
          M
        </div>
      )}
      <div className={`max-w-xs px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "chat-bubble-user text-white" : "chat-bubble-ai text-foreground"}`}>
        {msg.text}
      </div>
    </motion.div>
  );
}

export function DemoChat() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    messages.forEach((msg, i) => {
      if (msg.role === "ai") {
        setTimeout(() => setShowTyping(true), msg.delay - 800);
        setTimeout(() => { setShowTyping(false); setVisibleCount(i + 1); }, msg.delay);
      } else {
        setTimeout(() => setVisibleCount(i + 1), msg.delay);
      }
    });

    // Loop
    const total = messages[messages.length - 1].delay + 3000;
    const loop = setInterval(() => {
      started.current = false;
      setVisibleCount(0);
      setShowTyping(false);
      setTimeout(() => {
        started.current = true;
        messages.forEach((msg, i) => {
          if (msg.role === "ai") {
            setTimeout(() => setShowTyping(true), msg.delay - 800);
            setTimeout(() => { setShowTyping(false); setVisibleCount(i + 1); }, msg.delay);
          } else {
            setTimeout(() => setVisibleCount(i + 1), msg.delay);
          }
        });
      }, 500);
    }, total + 2000);

    return () => clearInterval(loop);
  }, [inView]);

  return (
    <section id="demo" className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
            <span className="text-xs font-medium text-palora-pink">Live Preview</span>
          </div>
          <h2 className="font-display font-black text-4xl lg:text-5xl mb-4">
            Feel the <span className="text-gradient">connection</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A glimpse into what a conversation with your Palora companion feels like.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-lg mx-auto glass-strong gradient-border rounded-3xl overflow-hidden shadow-glow"
        >
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-purple-blue flex items-center justify-center text-sm shadow-glow-sm">
                M
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Maya</p>
                <p className="text-xs text-palora-teal flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-palora-teal inline-block" />
                  Active now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <Phone className="w-3.5 h-3.5 text-palora-blue" />
              </button>
              <button className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-4 min-h-[260px]">
            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} visible={i < visibleCount} />
            ))}
            {showTyping && <TypingIndicator />}
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-border/40">
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-sm text-muted-foreground flex-1">Type a message...</span>
              <div className="w-7 h-7 rounded-lg bg-gradient-purple-blue flex items-center justify-center">
                <span className="text-white text-xs">↑</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
